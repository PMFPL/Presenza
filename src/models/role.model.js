const mongoose = require("mongoose");


const roleSchema = new mongoose.Schema({

    // Define the fields for the Role model
    // The name of the role (e.g., "Admin", "User", etc.)
    name: {
        type: String,
        required: true,
        unique: true,
    },


    //A brief description of the role's purpose or responsibilities
    description: String,

    // An array of permissions associated with the role 
    permissions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Permission",
        },
    ],


    // A boolean indicating whether the role is active or not
    isActive: {
        type: Boolean,
        default: true,
    },
}, {

    // Include timestamps for when the role was creaated and last updated
    timestamps: true,
});

module.exports = mongoose.model("Role", roleSchema);