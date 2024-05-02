const {Address} = require('../models/address');


exports.getUserAddress = async (req, res) => {
    try {
        const address = await Address.find({userId:req.params.id})
            
        if(!address){
            res.status(500).json({message:'The address with the given ID was not found'});
        }
        res.status(200).send(address);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching the address' });
    }
}


exports.createAddress = async (req, res) => {
    const { name, phone, shippingAddress1, shippingAddress2, zip, deliveryNote, userId, isDefault } = req.body;
    let newAddress = new Address({ name, phone, shippingAddress1, shippingAddress2, zip, deliveryNote, userId, isDefault });

    newAddress = await newAddress.save();
    
    if(!newAddress)
    return res.status(404).send('새로운 주소가 저장되지 않았습니다.')

    res.send(newAddress);
}

exports.updateDefaultAddress = async (req, res) => {
    console.log('userId', req.body)
    const {id} = req.params;
    const {userId} = req.body;

    try {
        await Address.updateMany({userId:userId}, {$set: {isDefault:false}});
        const updatedAddress = await Address.findByIdAndUpdate(id, {$set:{isDefault:true}},{new:true});
        res.send(updatedAddress);
    } catch (error) {
        res.status(400).send(error);
    }
}

exports.updateAddress = async (req, res) => {
    const address = await Address.findByIdAndUpdate(
        req.params.id,
        {   
            name: req.body.name,
            phone: req.body.phone,
            shippingAddress1: req.body.shippingAddress1,
            shippingAddress2: req.body.shippingAddress2,
            zip: req.body.zip,
            deliveryNote: req.body.deliveryNote,
            userId: req.body.userId,
            isDefault: req.body.isDefault
        },
        { new: true}
    )

    if(!address)
    return res.status(404).send('the address cannot be created!')
    
    res.send(address);
}

exports.deleteAddress = async (req, res) => {
    Address.findByIdAndRemove(req.params.id).then(address =>{
        if(address){
            return res.status(200).json({success:true, message:'the address is deleted'})
        } else {
            return res.status(404).json({success:false, message: "address not found"})
        }
    }).catch(err=>{
        return res.status(400).json({success: false, error: err})
    })    
}
