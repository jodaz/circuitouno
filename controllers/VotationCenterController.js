const Model = require('../models/VotationCenter');
const Person = require('../models/Person');

const get = async (req, res) => {
  const { range } = req.query;

  let [min, max] = JSON.parse(range);

  await Model.find()
    .skip(min+1)
    .limit(max+1)
    .sort({ createdAt: -1 })
    .then(models => {

      const contentRange = `votation centers ${range}/${models.length}`;
      
      res.status(200)
        .set('Content-Range', contentRange)
        .json(models);
    })
    .catch(err => res.status(400).json(err.message));
};

const store = async (req, res) => {
  const { ...data } = req.body;
  
  let votationCenter = new Model(data);

  await votationCenter.save()
    .then(model => res.status(200).json(model))
    .catch(err => res.status(400).json(err.message));
};

const update = async (req, res) => {
  const { id } = req.params;
  const { ...data } = req.body;

  const person = await Person.create(data);

  await Model.findByIdAndUpdate(id, {$inc: { 'votes': 1} }, {new: true})
    .then(model => {

      model.people.push(person);
      model.save();
      
      return res.status(200).json(model)
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

module.exports = { get, store, update, destroy };
