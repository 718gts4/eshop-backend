const {Popup} = require('../models/popup');

exports.getPopups = async (req, res) => {
    const popupList = await Popup.find();

    if(!popupList){
        res.status(500).json({success:false})
    }
    res.status(200).send(popupList);
}

exports.getPopup = async (req, res) => {
    try {
        const popup = await Popup.find({userId:req.params.id})
            
        if(!popup){
            res.status(500).json({message:'The popup with the given ID was not found'});
        }
        res.status(200).send(popup);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching the popup' });
    }
}

exports.updatePopup = async (req, res) => {
    const popup = await Popup.findByIdAndUpdate(
        req.params.id,
        {   
            image: req.body.image,
            userId: req.body.userId,
        },
        { new: true}
    )

    if(!popup)
    return res.status(404).send('the popup cannot be created!')
    
    res.send(popup);
}

exports.deletePopup = async (req, res) => {
    Popup.findByIdAndRemove(req.params.id).then(popup =>{
        if(popup){
            return res.status(200).json({success:true, message:'the popup is deleted'})
        } else {
            return res.status(404).json({success:false, message: "popup not found"})
        }
    }).catch(err=>{
        return res.status(400).json({success: false, error: err})
    })    
}