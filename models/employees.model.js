const mongoose = require('mongoose')

const employeeSchema = mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
        },
        email:{
            type:String,
            required:true,
            unique:true
        },
        mobile:{
            type:String,
            required:true
        },
        gender:{
            type:String,
            default:"male"
        },
        designation:{
            type:String,
            required:true
        },
        course:{
            type:Array,
            default:[]
        },
        image:{
            type:String,
        }
    },
    {
        timestamps:true
    }
)

module.exports= mongoose.model("Employee",employeeSchema);