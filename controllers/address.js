const {Address} = require('../models/address');
const { User } = require('../models/user');

exports.getAddressId = async (req, res) => {
    const address = await Address.findById(req.params.id)
        .populate('user', 'name')

    if(!address){
        res.status(500).json({message:'The address with the given ID was not found'})
    }
    res.status(200).send(address);
}

exports.createAddressAndAddToUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const { street, city, state, zip, country, title, userId } = req.body;
        const newAddress = new Address({ street, city, state, zip, country, title, userId });
        await newAddress.save();
        user.addresses.push(newAddress._id);
        await user.save();
        res.status(200).json({ message: 'Address created and added to user' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.updateAddress = async (req, res) => {
    const address = await Address.findByIdAndUpdate(
        req.params.id,
        {   
            title: req.body.title,
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            country: req.body.zip,
            userId: req.body.userId
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
