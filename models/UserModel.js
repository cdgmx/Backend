const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        first_name: {
            type: String,
            required: true,
        },
        last_name: {
            type: String,
            required: true,
        },
        email_address:{
            type: String,
            unique: true,
            required: true,
        },
        password:{
            type: String, 
            required: true,
        },
    }, 
    {
        timestamps: true
    }
);

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next();
    }
    //Encrypt password
    const salt = await bcrypt.genSaltSync(10);
    this.password=await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}

const User = mongoose.model('User', userSchema);

module.exports = User;