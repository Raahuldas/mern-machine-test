var express = require('express');
const ApiError = require('../utils/ApiError');
var router = express.Router();
const User = require('../models/user.model.js');
const verifyJWT = require('../middlewares/auth.middleware.js');
const Employee = require('../models/employees.model.js');
const upload = require('../middlewares/multer.middleware.js');

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }


  } catch (error) {
    next( new ApiError(500, "Something went wrong while generating referesh and access token"))
  }
}

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Login', nav: false });
});

router.get("/register", function (req, res) {
  res.render('register', { title: "Register", nav: false })
})

router.post("/register", async function (req, res,next) {
  const { username, name, password, email } = req.body;

  if (!username || !name || !password || !email) {
    next( new ApiError(400, "all fields are required"))
  }
  const existedUser = await User.findOne(
    {
      $or: [{ username }, { email }]
    }
  )

  if (existedUser) {
    next( new ApiError(400, "Username or email already exist"))
  }

  const user = await User.create(
    {
      username,
      password,
      email,
      name,
    }
  )

  const createdUser = await User.findById(user._id).select(" -password ")

  if (!user) {
    next(new ApiError(500, "error while registration"))
  }

  res.render("index", { title: "login", nav: false })

})

router.post("/login", async function (req, res,next) {
  const { username, email, password } = req.body;
  if (!username && !email) {
    next( new ApiError(400, "username or email is required"))
  }
  if (!password) {
    next(new ApiError(400, "password is required"))
  }

  const user = await User.findOne(
    {
      $or: [{ username }, { email }]
    }
  )

  if (!user) {
    next(new ApiError(400, "user does not exist"))
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    next(new ApiError(401, "password is incorrect"))
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user.id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .redirect("/dashboard")

  // .json(new ApiResponse(200, loggedInUser, "logged in"))

})

router.get("/logout", verifyJWT, async function (req, res,next) {
  const user = await User.findByIdAndUpdate(req.user.id,
    {
      $unset: { refreshToken: 1 }
    },
    {
      new: true
    });

  if (!user) {
    next( new ApiError(400, "unauthorized request"))
  }

  const options = {
    httpOnly: true,
    secure: true
  }


  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .redirect("/")

  // .json(new ApiResponse(200, user, "logged out"))
})

router.get("/dashboard",verifyJWT, function (req, res) {
  const loggedUser = req.user.name;

  res.render("dashboard", { title: "dashboard", nav: true, loggedUser})
})

router.get("/employee-list",verifyJWT, async function (req, res) {
  const emp = await Employee.find();
  const loggedUser = req.user.name;

  res.render("employeeList", { title: "employees", nav: true, emp, loggedUser })
})

router.get("/create-emp",verifyJWT, function (req, res) {
  const loggedUser = req.user.name;

  res.render("createEmployee", { title: "Create Employee", nav: true, loggedUser })
})

router.post("/create-emp",verifyJWT, upload.single("image"), async function (req, res) {
  const { name, email, mobile, gender, designation, course } = req.body;
  const img = req.file?.filename;

  await Employee.create(
    {
      name,
      email,
      mobile,
      gender,
      designation,
      course,
      image: img || ""
    }
  )

  res.redirect("/employee-list")
})

router.get("/edit-emp/:empId",verifyJWT,async function (req, res) {
  const { empId } = req.params

  const emp =await Employee.findById(empId);

  const loggedUser = req.user.name;
  console.log(loggedUser);
  res.render("editEmployee", { title: "edit employee", nav: true, empId, loggedUser,emp })
})

router.post("/edit-emp/:empId",verifyJWT,upload.single("image"), async function (req, res) {
  const { empId } = req.params;
  const { name, email, designation, mobile, gender, course } = req.body;

  const img = req.file?.filename;

  await Employee.findByIdAndUpdate(
    empId,
    {
      $set: {
        name,
        email,
        designation,
        mobile,
        gender,
        course,
        image: img || ""
      }

    },
    {
      new: true
    }
  )

  res.redirect("/employee-list");
})

router.get("/delete-emp/:empId",async function(req,res){
  const {empId} =req.params;
  await Employee.findByIdAndDelete(empId)
  res.redirect("/employee-list")
})

router.get("/search/:value", async function(req,res){
    const regex = new RegExp(`^${req.params.value}`,'i');
    const user = await Employee.find({name:regex});
    res.json(user);
})

module.exports = router;
