const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const GridFsStorage = require("multer-gridfs-storage")
const crypto = require("crypto")
const path = require("path")

require("dotenv").config()

const MONGO_URI = process.env.MONGO_URI
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
const conn = mongoose.connection

//Post
const postSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  author: { type: String, default: "" },
  body: { type: String, default: "" },
  date: { type: Date, default: Date.now },
})
const Post = mongoose.model("Post", postSchema)

//User
const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  posts: { type: [mongoose.ObjectId], default: [] },
  image_name: String,
})
const User = mongoose.model("User", userSchema)

module.exports = {
  //Posts
  get_post_by_id: async (id) => {
    try {
      const user = await User.findOne({ posts: { $in: id } })
      const post = await Post.findById(id)
      return [post, user.image_name]
    } catch (e) {
      throw e
    }
  },
  get_image_data_by_name: async (img_name, res) => {
    try {
      const gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: "images",
      })
      gfs.openDownloadStreamByName(img_name).pipe(res)
    } catch (e) {
      throw e
    }
  },
  get_posts: async () => {
    const posts = await Post.find({}).catch((e) => {
      throw e
    })
    return posts
  },
  add_post: async (post) => {
    try {
      post = new Post(post)
      const posts = await post.save()
      await User.findOneAndUpdate(
        { username: post.author },
        { $addToSet: { posts: post._id } }
      )
      return posts
    } catch (e) {
      throw e
    }
  },
  delete_post: async (id) => {
    Post.findByIdAndDelete(id)
      .catch((e) => {
        throw e
      })
      .then(() => {
        console.log("Deleted")
      })
  },
  edit_post: async (post) => {
    Post.findByIdAndUpdate(post._id, post)
      .catch((e) => {
        throw e
      })
      .then(() => {
        console.log("Edited successfully!")
      })
  },
  //Users
  get_user_by_id: async (id) => {
    user = await User.findById(id).catch((e) => {
      throw e
    })
    return user
  },
  get_user_by_email: async (email) => {
    user = await User.findOne({ email: email }).catch((e) => {
      throw e
    })
    return user
  },
  get_user_by_username: async (username) => {
    user = await User.findOne({ username: username }).catch((e) => {
      throw e
    })
    return user
  },
  create_user: async (user, img_name) => {
    try {
      user.image_name = img_name ? img_name : "1588174381042.png"
      user.password = await bcrypt.hash(user.password, 10)
      const users = await new User(user).save()
    } catch (e) {
      throw "Error found" + e
    }
  },
  storage: new GridFsStorage({
    url: MONGO_URI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err)
          }
          const filename = buf.toString("hex") + path.extname(file.originalname)
          const fileInfo = {
            filename: filename,
            bucketName: "images",
          }
          resolve(fileInfo)
        })
      })
    },
  }),
}
