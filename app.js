const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const { body, validationResult, check } = require('express-validator');
const methodOverride = require('method-override');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

// Koneksi database
require('./utils/db');

// Model Siswa & User
const Siswa = require('./model/siswa');
const User = require('./model/user');

const app = express();
const port = 3000;


// Middleware Setup
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Layout EJS
app.set('layout', 'layouts/main-layout');
app.set('view engine', 'ejs');
app.use(expressLayouts);

// Flash Message Setup
app.use(cookieParser());
app.use(
  session({
    secret: 'secretKey123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, 
      secure: false, 
      sameSite: 'strict'
    },
  })
);
app.use(flash());


// Middleware Proteksi Halaman
function authMiddleware(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}


// login
app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login Admin',
    msg: req.flash('msg'),
    layout: 'layouts/main-layout',
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });

  if (!user) {
    req.flash('msg', 'Username atau password salah!');
    return res.redirect('/login');
  }

  req.session.user = user;
  res.redirect('/');
});


// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});


// Home
app.get('/', authMiddleware, (req, res) => {
  res.render('index', {
    title: 'Halaman Home',
    username: req.session.user.username,
    layout: 'layouts/main-layout',
  });
});


// About
app.get('/about', authMiddleware, (req, res) => {
  res.render('about', {
    title: 'Halaman About',
    username: req.session.user.username,
    layout: 'layouts/main-layout',
  });
});


// List siswa
app.get('/siswa', authMiddleware, async (req, res) => {
  const siswa = await Siswa.find();

  res.render('siswa', {
    title: 'Halaman Data Siswa',
    layout: 'layouts/main-layout',
    siswa,
    msg: req.flash('msg'),
  });
});


// Form tambah siswa
app.get('/siswa/add', authMiddleware, (req, res) => {
  res.render('add-siswa', {
    title: 'Form Tambah Data Siswa',
    layout: 'layouts/main-layout',
  });
});


// Proses tambah siswa
app.post(
  '/siswa',
  authMiddleware,
  [
    body('nisn')
      .isLength({ min: 8, max: 8 }).withMessage('NISN wajib 8 digit angka!')
      .custom(async (value) => {
        const duplikat = await Siswa.findOne({ nisn: value });
        if (duplikat) {
          throw new Error('NISN sudah terdaftar!');
        }
        return true;
      }),

    body('nik')
      .isLength({ min: 16, max: 16 }).withMessage('NIK wajib 16 digit angka!')
      .custom(async (value) => {
        const duplikatNik = await Siswa.findOne({ nik: value });
        if (duplikatNik) {
          throw new Error('NIK sudah terdaftar!');
        }
        return true;
      }),

    body('nokk')
      .isLength({ min: 16, max: 16 }).withMessage('No. KK harus 16 digit angka!'),
  ],
  
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render('add-siswa', {
        title: 'Form Tambah Data Siswa',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        siswa: req.body,
      });
    }

    await Siswa.insertMany(req.body);
    req.flash('msg', 'Data siswa berhasil ditambahkan!');
    res.redirect('/siswa');
  }
);


// Form edit siswa
app.get('/siswa/edit/:nisn', authMiddleware, async (req, res) => {
  const siswa = await Siswa.findOne({ nisn: req.params.nisn });

  res.render('edit-siswa', {
    title: 'Form Ubah Data Siswa',
    layout: 'layouts/main-layout',
    siswa,
  });
});

// Proses update siswa
app.put(
  '/siswa',
  authMiddleware,
  [
    // Validasi NISN
    body('nisn').custom(async (value, { req }) => {
      const duplikat = await Siswa.findOne({ nisn: value });
      if (value !== req.body.oldNisn && duplikat) {
        throw new Error('NISN sudah digunakan!');
      }
      return true;
    }),

    // Validasi NO KK
    body('nokk')
      .isLength({ min: 16, max: 16 }).withMessage('No. KK harus 16 digit angka!')
      .isNumeric().withMessage('No. KK harus angka!'),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render('edit-siswa', {
        title: 'Form Ubah Data Siswa',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        siswa: req.body,
      });
    }

    await Siswa.updateOne(
      { nisn: req.body.oldNisn }, 
      {
        $set: {
          nisn: req.body.nisn,
          nik: req.body.nik,
          nokk: req.body.nokk,          // <--- menambah
          tingkat: req.body.tingkat,
          rombel: req.body.rombel,
          tgl_masuk: req.body.tgl_masuk,
          terdaftar: req.body.terdaftar
        },
      }
    );

    req.flash('msg', 'Data siswa berhasil diubah!');
    res.redirect('/siswa');
  }
);


// Hapus siswa
app.delete('/siswa', authMiddleware, async (req, res) => {
  await Siswa.deleteOne({ nisn: req.body.nisn });
  req.flash('msg', 'Data siswa berhasil dihapus!');
  res.redirect('/siswa');
});


app.listen(port, () => {
  console.log(`App Siswa berjalan di http://localhost:${port}`);
});