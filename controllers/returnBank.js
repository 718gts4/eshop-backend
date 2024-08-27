const {ReturnBank} = require('../models/returnBank');


exports.getReturnBank = async (req, res) => {
    try {
        const returnBank = await ReturnBank.find({userId:req.params.id})
            
        if(!returnBank){
            res.status(500).json({message:'The bank account with the given ID was not found'});
        }
        res.status(200).send(returnBank);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching the bank account' });
    }
}

exports.createReturnBank = async (req, res) => {
    const { accountName, accountNumber, bankName } = req.body;
    const userId = req.params.id;

    let newBankAccount = new ReturnBank({ accountName, accountNumber, bankName, userId });

    newBankAccount = await newBankAccount.save();
    
    if(!newBankAccount)
    return res.status(404).send('새로운 계좌가 저장되지 않았습니다.')

    res.send(newBankAccount);
}

exports.updateReturnBank = async (req, res) => {
    console.log('USER ID', req.params.id)
    const returnBank = await ReturnBank.findOneAndUpdate({userId:req.params.id},
        {   
            accountName: req.body.accountName,
            accountNumber: req.body.accountNumber,
            bankName: req.body.bankName,
        },
        { new: true}
    )

    if(!returnBank)
    return res.status(404).send('the bank account cannot be updated!')
    
    res.send(returnBank);
}

exports.deleteReturnBank = async (req, res) => {
    ReturnBank.findByIdAndRemove(req.params.id).then(bank =>{
        if(bank){
            return res.status(200).json({success:true, message:'the bank account is deleted'})
        } else {
            return res.status(404).json({success:false, message: "bank account not found"})
        }
    }).catch(err=>{
        return res.status(400).json({success: false, error: err})
    })    
}