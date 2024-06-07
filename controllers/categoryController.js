const categoryDB = require('../models/category')
const multer = require('multer');
const path = require('path');
const { categorySchema } = require('../models/joi');



//category
const categories = async (req, res) => {
  try {
    const Categories = await categoryDB.find()
    
    res.render('admin/categories', { Categories})
  } catch (error) {
   console.log(error); 
  }
}

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// add category
const addCategory = async (req, res) => {
  try {
    
    console.log('add cat');
    res.render('admin/add-category')
  } catch (error) {
    console.log(error);
  }
}

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

//addingCategory
const addingCategory = async (req, res) => {
  try {
    console.log("adding category")
    console.log('req bod: ', req.body);

    const { error } = categorySchema.validate(req.body, { allowUnknown: true });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const {name, description} = req.body
    console.log(req.file);
    if (!req.file) {
      return res.status(400).json({ message: 'Media not selected' });
    }

    const existingCategory = await categoryDB.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exist' });
    }

    const save = await categoryDB.create({name,description,img:req.file.filename})
    if (save) {
      return res.status(200).json({ message: 'Category added successfully', save: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'An error occurred while adding the category' });
  }
}

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

//edit category
const editCategory = async (req, res) => {
  try {
    const Category = await categoryDB.findOne({_id:req.query.catId})
  
  
    res.render('admin/edit-category', {Category})
    
  } catch (error) {
    console.log(error); 
  }
}

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// get edited data
const editingCategory = async (req, res) => {
  try {    
    console.log(req.query);

    const { error } = categorySchema.validate(req.body, { allowUnknown: true });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const { name, description } = req.body;
    const { catId } = req.query;
    const img = req.file;

    if (!catId) {
      return res.status(400).json({ message: 'Category id not found' });
    }

    const existingCategory = await categoryDB.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: catId }
    }); 
    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exist' });
    }

    const updateData = { name, description };
    if (img) {
      updateData.img = img.filename;
    }

    const update = await categoryDB.findByIdAndUpdate(
      catId,
      { $set: updateData },
      { new: true } 
    );

    if (update) {
      return res.status(200).json({ message: 'Category edited successfully', save: true });
    } else {
      return res.status(400).json({ message: 'error in saving the edit' });
    }

  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: 'An error occurred while updating the category' });
  }
}

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// list and unlist
const updateCatStatus = async (req, res) => {
  try {
    const { id: catId } = req.params;
    console.log('id: ' + catId);

    const cat = await categoryDB.findById(catId);
    if (cat) {
      cat.status = !cat.status;
      await cat.save();
      console.log(`${cat.name}'s status changed to: ${cat.status}`);
      
      res.send({ success: true });
    } else {
      console.log('Category ID not found');
      res.send({ success: false });
    }
  } catch (error) {
    console.log("Error in updating category status", error.message);
  }
};

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


module.exports = { categories, addCategory,
  addingCategory, editCategory, editingCategory,
  updateCatStatus, 
}