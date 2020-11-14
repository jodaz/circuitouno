const Model = require('../models/VotationCenter');
const Person = require('../models/Person');
const User = require('../models/User');
const validator = require('../validation/votationCenters');

const get = async (req, res) => {
  const { page, perPage } = req.query;

  const limit = parseInt(perPage);
  const skip = (page == 1) ? 0 : page * perPage - perPage;
  const total = await Model.count({});

  await Model.find()
    .limit(limit) 
    .skip(skip)
    .sort({ createdAt: -1 })
    .then(models => {
      res.status(200)
        .json({ data: models, total: total });
    })
    .catch(err => res.status(400).json(err.message));
};

const show = async (req, res) => {
  const { id } = req.query;

  await Model.findOne(id)
    .populate('user')
    .then(model => res.status(200).json(model))
    .catch(err => res.status(400).json(err.message));
}

const store = async (req, res) => {
  const data = req.body;
  
  let votationCenter = new Model(data);

  await votationCenter.save()
    .then(model => {
      User.findByIdAndUpdate(model.user, { votationCenter: model.id }, { new: true }) 
        .then(() => res.status(200).json(model));
    })
    .catch(err => res.status(400).json(err.message));
};

const vote = async (req, res) => {
  const { id } = req.params;
  const { ...data } = req.body;

  const { errors, isValid } = validator.vote(data);

  if (!isValid) return res.status(400).json({ data: errors });

  await Person.find({ 'personId': data.personId })
    .then(model => {
      if (!isEmpty(model)) {
        return res.status(400).json({
          data: { 'personId': 'El votante se encuentra registrado.'  }
        });
      }
    });

  const person = await Person.create(data);

  await Model.findByIdAndUpdate(id, {$inc: { 'votes': 1} }, {new: true})
    .then(model => {

      model.people.push(person);
      model.save();
      
      return res.status(200).json(model)
    }).catch(err => res.status(400).json(err.message));
};

const update = async (req, res) => {
  const { id } = req.query;
  const {
    name,
    parish,
    user,
    municipality
  } = req.body;

  const data = {
    'name': name,
    'parish': parish,
    'user': user,
    'municipality': municipality
  };

  const { errors, isValid } = validator.update(data);

  if (!isValid) return res.status(400).json({ data: errors });

  const model = await Model.findOne(id);

  await User.findByIdAndUpdate(model.user, { votationCenter: null }, { new: true });
  await Model.findByIdAndUpdate(id, data, {new: true})
    .then(model => {
      User.findByIdAndUpdate(model.user, { votationCenter: model.id }, { new: true }) 
        .then(() => res.status(200).json(model));
      return res.status(200).json(model);
    }).catch(err => res.status(400).json(err.message));
};

const destroy = async (req, res) => {
  const { id } = req.params;

  await Model.findOneAndDelete({ '_id': id})
    .then(() => res.status(200).json({
      message: '¡Elemento eliminado!'
    }))
    .catch(err => res.status(400).json(err.message));
};

module.exports = { update, show, get, store, vote, destroy };
