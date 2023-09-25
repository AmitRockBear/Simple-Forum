const express = require('express')
const app = express()
const flash = require('express-flash')
const session = require('express-session')
const passport = require('passport')
const initializePassport = require('./passport-config')
const model = require('./Model')
const multer = require('multer')


// Init Upload
const upload = multer({ storage: model.storage })


require('dotenv').config()

app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/assets'))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    reasve: false,
    saveUninitialized: false
}))

initializePassport(
    passport,
    model.get_user_by_email,
    model.get_user_by_id
  )
app.use(passport.initialize())
app.use(passport.session())


app.set('view engine', 'ejs')
app.listen(3000)

const render_posts_page = (res) => {
    model.get_posts().then(posts => {
        res.render('./View.ejs', { data: posts })
    })
}

//Authentication requests + functions
const render_register_page = (res) => {
    res.render('./Register.ejs')
}

const checkNotAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
      } 
      res.redirect('/login')
}

const checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return res.redirect('/posts')
    }
    next()
}

const validateEmail = (email) => {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
        return true
    else
        return false
}

const validatePassword = (pass) => {
    var passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
    if (pass.match(passw)) { 
        return true;
    } else {
        return false
    }
}

const validateUsername = (username) => {
    if (username.length >= 5)
        return true
    else
        return false
}

app.get('/register', checkAuthenticated, (req, res) => {
    render_register_page(res)
})

app.post('/register', upload.single('file'), (req, res) => {
    if (validateEmail(req.body.email) && validatePassword(req.body.password) && validateUsername(req.body.username)) {
        model.get_user_by_email(req.body.email).then((ans) => {
            if (ans == null){
                model.get_user_by_username(req.body.username).then( answer => {
                    if (answer == null) {
                        if (req.file) {
                            model.create_user(req.body, req.file.filename).then(() => {
                                res.redirect('/login')
                            })
                        } else {
                            model.create_user(req.body, false).then(() => {
                                res.redirect('/login')
                            })
                        }
                    }
                    else{
                        req.flash('error', 'Username already exists in our databse, please use another username')
                        res.redirect('/register')
                    } 
                }) 
            } else {
                req.flash('error', 'Email already exists in our databse, please use another email')
                res.redirect('/register')
            }
        })
    } else {
        if (!validateEmail(req.body.email)) {
            req.flash('error', 'This email is not valid')
            res.redirect('/register')
        } else {
            if (!validateUsername(req.body.username)){
                req.flash('error', 'This username is not valid: username must have atleast 5 characters')
                res.redirect('/register')
            } else {
                if (!validatePassword(req.body.password)){
                    req.flash('error', 'This password is not valid: password must have 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter')
                    res.redirect('/register')
                }
            }
        }   
    }   
})

app.get('/login', checkAuthenticated, (req, res) => {
    res.render('./Login')
})

app.post('/login', checkAuthenticated, passport.authenticate('local', {
        successRedirect: '/posts',
        failureRedirect: '/login',
        failureFlash: true,
    })
)

app.get('/logout', function(req, res){
    req.logOut();
    res.redirect('/login');
  });


//Posts
app.get('/posts', checkNotAuthenticated, (req, res) => {
    render_posts_page(res)
})

app.get('/posts/post/:id', checkNotAuthenticated, (req, res) => {
    model.get_post_by_id(req.params.id).then(([post, img_name]) => {
        res.render('./Post.ejs', { data: post, image_name: img_name })
    })
})

app.get('/posts/post/image/:img_name', (req, res) => {
    model.get_image_data_by_name(req.params.img_name, res)       
});

app.get('/posts/:id', checkNotAuthenticated, (req, res) => {
    model.get_post_by_id(req.params.id).then(post => {
        res.json(post[0])
    })
})

app.post('/posts', checkNotAuthenticated, async (req, res) => {
    try {
        const user = await model.get_user_by_id(req.user._id);
        console.log(user)
        const post_user = {
            author: user.username,
            title: req.body.title,
            body: req.body.body,
        };
        const posts = await model.add_post(post_user);
        res.json(posts);
    } catch (err) {
        throw err
    }
});

app.post('/posts/:id', checkNotAuthenticated, (req, res) => {
    model.edit_post(req.body).then(() => {
        render_posts_page(res)
    })
})

app.delete('/posts/:id', checkNotAuthenticated, (req, res) => {
    console.log(req.params)
    id = req.params.id
    model.delete_post(id).then(() => {
        render_posts_page(res)
    }) 
})

