const {Card} = require('../models/card');
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTIONKEY, "hex");

function decrypt(iv, encryptedData) {
    let ivBuffer = Buffer.from(iv, "hex");
    let encryptedDataBuffer = Buffer.from(encryptedData, "hex");
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), ivBuffer);
    let decrypted = decipher.update(encryptedDataBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

exports.getUserCard = async (req, res) => {
    const userId = req.params.userId;
    try {
        const cards = await Card.find(userId);
        const card = cards[0];
            
        if(!card){
            return res.status(404).json({message:'카드를 찾을 수 없습니다'});
        }

        const decipheredCardNumber = decrypt(card.cardNumber.iv, card.cardNumber.encryptedData);
        const decipheredExpDateMonth = decrypt(card.expDateMonth.iv, card.expDateMonth.encryptedData);
        const decipheredExpDateYear = decrypt(card.expDateYear.iv, card.expDateYear.encryptedData);

        const decipheredCard = {
            cardNum: decipheredCardNumber, 
            expDateMonth:decipheredExpDateMonth, 
            expDateYear:decipheredExpDateYear, 
            isDefault:card.isDefault, 
            id:card._id  
        };

        res.status(200).send(decipheredCard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching the card' });
    }
}

exports.createCard = async (req, res) => {
    const { name, cardNumber, expDateMonth, expDateYear, userId, isDefault } = req.body;

    const algorithm = "aes-256-cbc";
    const key = Buffer.from(process.env.ENCRYPTIONKEY, "hex");
    const iv = crypto.randomBytes(16);

    function encrypt(text) {
        let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return { iv: iv.toString("hex"), encryptedData: encrypted.toString("hex") };
    }
    
    let cardNumberHash = encrypt(cardNumber);
    let expDateMonthHash = encrypt(expDateMonth);
    let expDateYearHash = encrypt(expDateYear);

    let newCard = new Card({
        name,
        cardNumber:cardNumberHash,
        expDateMonth:expDateMonthHash,
        expDateYear:expDateYearHash,
        userId,
        isDefault,
    });

    newCard = await newCard.save();
    
    if(!newCard)
    return res.status(404).send('새로운 주소가 저장되지 않았습니다.')

    res.send(newCard);
}

exports.updateDefaultCard = async (req, res) => {
    const {id} = req.params;
    const {userId} = req.body;

    try {
        await Card.updateMany({userId:userId}, {$set: {isDefault:false}});
        const updatedCard = await Card.findByIdAndUpdate(id, {$set:{isDefault:true}},{new:true});
        res.send(updatedCard);
    } catch (error) {
        res.status(400).send(error);
    }
}

exports.updateCard = async (req, res) => {
    const card = await Card.findByIdAndUpdate(
        req.params.id,
        {   
            name: req.body.name,
            cardNumber: req.body.cardNumber,
            expDateMonth: req.body.expDateMonth,
            expDateUear: req.body.expDateUear,
            userId: req.body.userId,
            isDefault: req.body.isDefault
        },
        { new: true}
    )

    if(!card)
    return res.status(404).send('the address cannot be created!')
    
    res.send(card);
}

exports.deleteCard = async (req, res) => {
    Card.findByIdAndRemove(req.params.id).then(card =>{
        if(card){
            return res.status(200).json({success:true, message:'the card is deleted'})
        } else {
            return res.status(404).json({success:false, message: "card not found"})
        }
    }).catch(err=>{
        return res.status(400).json({success: false, error: err})
    })    
}