const {Category} = require('../models/category');
const slugify = require('slugify');

// scroll through category parentIds and attach children category
function createCategories(categories, parentId = null){
    const categoryArray = [];
    let category;
    if(parentId == null){
        category = categories.filter(cat => cat.parentId == undefined);
    } else {
        category = categories.filter(cate => cate.parentId == parentId);
    }

    for(let cate of category){
        categoryArray.push({
            _id: cate._id,
            name: cate.name,
            slug: cate.slug,
            children: createCategories(categories, cate._id)
        })
    }

    return categoryArray;
}

exports.getCategory = async (req, res) => {
    const categoryList = await Category.find();

    if(!categoryList){
        res.status(500).json({success:false})
    }
    
    // compile a list of parent children categories
    if(categoryList){
        const categories = createCategories(categoryList);
        res.status(200).send(categories);
    }
}

exports.getCategoryId = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if(!category){
        res.status(500).json({message:'The category with the given ID was not found'})
    }
    res.status(200).send(category);
}

exports.postCategory = async (req, res) => {
    let category = new Category({
        name: req.body.name,
        slug: slugify(req.body.name),
        icon: req.body.icon,
        color: req.body.color
    })

    if(req.body.parentId){
        category.parentId = req.body.parentId;
    }

    category = await category.save();

    if(!category)
    return res.status(404).send('the category cannot be created!')
    
    res.send(category);
}

exports.updateCategory = async (req, res) => {
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color
        },
        { new: true}
    )

    if(!category)
    return res.status(404).send('the category cannot be created!')
    
    res.send(category);
}

exports.deleteCategory = async (req, res) => {
    Category.findByIdAndRemove(req.params.id).then(category =>{
        if(category){
            return res.status(200).json({success:true, message:'the category is deleted'})
        } else {
            return res.status(404).json({success:false, message: "category not found"})
        }
    }).catch(err=>{
        return res.status(400).json({success: false, error: err})
    })    
}