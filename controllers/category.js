const {Category} = require('../models/category');
const slugify = require('slugify');

function createCategories(categories, parentId = null, parentName = null){
    const categoryList = [];
    let category;
    if(parentId == null) {
        category = categories.filter(cat => cat.parentId === undefined);
    } else {
        category = categories.filter(cat => cat.parentId === parentId.toString());
    }

    for(let cate of category) {
        const categoryObj = {
            _id: cate._id,
            name: cate.name,
            slug: cate.slug,
            parentName: parentName,
            children: createCategories(categories, cate._id, cate.name)
        };
    }
    categoryList.push(categoryObj);
    
    return categoryList;
};

exports.getCategory = async (req, res) => {
    const categoryList = await Category.find();

    if(!categoryList){
        res.status(500).json({success:false})
    }
    res.status(200).send(categoryList);
}

// retrieving category tree with subcategories
exports.getCategories =  (req, res) => {
    Category.find({})
    .exec((error, categories) => {
        if(error) return res.status(400).json({error});

        if(categories){
            const categoryList = createCategories(categories);
            res.status(200).json({categoryList});
        }
    })
}

exports.getCategoryId = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if(!category){
        res.status(500).json({message:'The category with the given ID was not found'})
    }
    res.status(200).send(category);
}

exports.postCategory = async (req, res) => {
    try{
        let category = new Category({
                name: req.body.name,
                icon: req.body.icon,
                color: req.body.color,
                slug: slugify(req.body.name),
                parentId: req.body.parentId
            })

            category = await category.save();

            if(!category)
            return res.status(404).send('the category cannot be created!')
            
            res.send(category);
    } catch (error) {
        res.status(500).send(error.message);
    }
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
