const localStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')


function init(passport, get_user_by_email, get_user_by_id){
    const authenticateUser = async (email, password, done) => {
        get_user_by_email(email).then(user => {
            if (user == null){
                return done(null, false, { message: 'There is not a registered account using this email'})
            }
            try{
                bcrypt.compare(password, user.password, function(err, result) {
                    if (result)
                        return done(null, user)
                    else
                        return done(null, false, { message: 'Password incorrect' })
                    })
            } catch (e) {
                return done(e)
            }
        });  
    }
    passport.use(new localStrategy({usernameField: 'email'}, authenticateUser))
    passport.serializeUser((user, done) => done(null, user._id))
    passport.deserializeUser((id, done) => {
        get_user_by_id(id).then(user => {
            return done(null, user)
        })
    })
}
    
module.exports = init



