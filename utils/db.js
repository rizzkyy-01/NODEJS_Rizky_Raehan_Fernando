const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/dapodik")
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));


// Menambah 1 data
// const contact1 = new Contact({
//     nama: 'Ardan Aras',
//     nohp: '0897654321',
//     email: 'ardan@gmail.com',
// });

// Simpan ke collection
// contact1.save().then((contact) => console.log(contact));