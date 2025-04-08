// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const multer = require("multer");
// const sharp = require("sharp");
// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
// const axios = require("axios");

// dotenv.config();
// const app = express();
// app.use(express.json());
// app.use(cors());

// // ✅ **Connect to MongoDB**
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("✅ Connected to MongoDB"))
//   .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// // ✅ **Define MongoDB Schema & Model**
// const UserSchema = new mongoose.Schema({
//   fullName: { type: String, required: true },
//   whatsapp: { type: String, required: true },
//   email: { type: String, default: "" },
//   createdAt: { type: Date, default: Date.now },
// });

// const User = mongoose.model("User", UserSchema);

// // ✅ **DigitalOcean Spaces Configuration**
// const s3 = new S3Client({
//   endpoint: process.env.DO_SPACES_ENDPOINT,
//   region: process.env.DO_SPACES_REGION,
//   credentials: {
//     accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
//     secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
//   },
// });

// // ✅ **Multer Setup for Image Uploads**
// const upload = multer({
//   storage: multer.memoryStorage(),
// }).array("images", 15); // Allows up to 10 images

// // ✅ **Save User Info Endpoint**
// app.post("/save-user-info", async (req, res) => {
//   try {
//     const { fullName, whatsapp, email } = req.body;

//     if (!fullName || !whatsapp) {
//       return res
//         .status(400)
//         .json({ error: "Full Name and WhatsApp are required!" });
//     }

//     const newUser = new User({ fullName, whatsapp, email });
//     await newUser.save();

//     res
//       .status(201)
//       .json({ success: true, message: "User info saved successfully!" });
//   } catch (error) {
//     console.error("❌ Error Saving User Info:", error);
//     res.status(500).json({ error: "Failed to save user information" });
//   }
// });

// app.get("/get-users", async (req, res) => {
//   try {
//     const users = await User.find().sort({ createdAt: -1 });
//     res.json(users);
//   } catch (error) {
//     console.error("❌ Error Fetching Users:", error);
//     res.status(500).json({ error: "Failed to fetch users" });
//   }
// });

// app.get("/get-rate-limit", async (req, res) => {
//   try {
//     const url = `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/content_publishing_limit`;
    
//     const response = await axios.get(url, {
//       params: {
//         access_token: process.env.ACCESS_TOKEN, // You need to provide this
//       },
//     });

//     res.jsonrdesacd8
//      // Send the actual data
//     console.log("✅ Rate Limit Response:", response.data);
//   } catch (error) {
//     console.error("❌ Error Fetching Limit:", error.response?.data || error.message);
//     res.status(500).json({ error: "Failed to fetch rate limit" });
//   }
// });

// // ✅ **Post to Instagram Endpoint**
// app.post("/post-to-instagram", upload, async (req, res) => {
//   let postId;
//   let permalink = null;
//   const uploadedImages = [];
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ error: "No images uploaded." });
//     }

//     const caption = req.body.caption || "Posted via Gopass";
   

//     // Process each image
//     for (const file of req.files) {
//       const STANDARD_WIDTH = 1080;
//       const STANDARD_HEIGHT = 1080;

//       // Resize image
//       const resizedImageBuffer = await sharp(file.buffer)
//         .resize(STANDARD_WIDTH, STANDARD_HEIGHT, {
//           fit: "contain",
//           background: { r: 0, g: 0, b: 0, alpha: 0 },
//         })
//         .toBuffer();

//       // Get updated image dimensions
//       const metadata = await sharp(resizedImageBuffer).metadata();
//       const { width, height } = metadata;

//       // Watermark with gradient
//       const fontSize = Math.max(Math.floor(width * 0.03), 15);
//       const textSvg = `
//       <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.ceil(
//         fontSize * 2.5
//       )}">
//         <defs>
//           <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="0%" stop-color="black" stop-opacity="0"/>
//             <stop offset="50%" stop-color="black" stop-opacity="0.5"/>
//             <stop offset="100%" stop-color="black" stop-opacity="1"/>
//           </linearGradient>
//         </defs>
//         <rect width="${width}" height="${Math.ceil(
//         fontSize * 2.5
//       )}" fill="url(#gradient)"/>
//         <text x="20" y="${Math.floor(
//           fontSize * 1.8
//         )}" font-family="Arial" font-size="${fontSize}" fill="white">
//           Posted via
//           <tspan font-weight="bold"> Gopass</tspan>
//         </text>
//       </svg>`;

//       const textBuffer = Buffer.from(textSvg);

//       // Overlay watermark
//       const watermarkedImage = await sharp(resizedImageBuffer)
//         .composite([
//           {
//             input: textBuffer,
//             top: height - Math.ceil(fontSize * 2.5),
//             left: 20,
//           },
//         ])
//         .toFormat("jpeg")
//         .toBuffer();

//       // Generate filename
//       const filename = `uploads/${Date.now()}-${file.originalname.replace(
//         /\s/g,
//         "-"
//       )}`;

//       // Upload to DigitalOcean Spaces
//       const uploadParams = {
//         Bucket: process.env.DO_SPACES_BUCKET,
//         Key: filename,
//         Body: watermarkedImage,
//         ACL: "public-read",
//         ContentType: "image/jpeg",
//       };

//       await s3.send(new PutObjectCommand(uploadParams));

//       const fileUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${filename}`;
//       console.log("Image uploaded:", fileUrl);
//       uploadedImages.push(fileUrl);
//     }



//     if (uploadedImages.length === 1) {
//       const uploadResponse = await axios.post(
//         `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/media`,
//         {
//           image_url: uploadedImages[0],
//           caption,
//           access_token: process.env.ACCESS_TOKEN,
//         }
//       );

//       const creationId = uploadResponse.data.id;

//       // Publish the image
//       const publishResponse = await axios.post(
//         `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/media_publish`,
//         {
//           creation_id: creationId,
//           access_token: process.env.ACCESS_TOKEN,
//         }
//       );

//       postId = publishResponse.data.id;
   
//       try {
//         const postDetails = await axios.get(
//           `https://graph.facebook.com/v18.0/${postId}?fields=permalink&access_token=${process.env.ACCESS_TOKEN}`
//         );
//         permalink = postDetails.data.permalink;
//       } catch (error) {
//         console.error("❌ Failed to fetch Instagram post URL:", error.response?.data || error.message);
//         permalink = "Instagram link retrieval failed"; // Prevents crashing
//       }
      
//     } else {
//       // Multiple images → Create a carousel
//       const creationIds = [];
//       for (const imageUrl of uploadedImages) {
//         const uploadResponse = await axios.post(
//           `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/media`,
//           {
//             image_url: imageUrl,
//             access_token: process.env.ACCESS_TOKEN,
//           }
//         );
//         creationIds.push(uploadResponse.data.id);
//       }

//       // Create a carousel post
//       const carouselResponse = await axios.post(
//         `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/media`,
//         {
//           media_type: "CAROUSEL",
//           children: creationIds,
//           caption: caption,
//           access_token: process.env.ACCESS_TOKEN,
//         }
//       );

//       postId = carouselResponse.data.id;

//       // Publish the carousel
//       await axios.post(
//         `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/media_publish`,
//         {
//           creation_id: postId,
//           access_token: process.env.ACCESS_TOKEN,
//         }
//       );

//       try {
//         const postDetails = await axios.get(
//           `https://graph.facebook.com/v18.0/${postId}?fields=permalink&access_token=${process.env.ACCESS_TOKEN}`
//         );
//         permalink = postDetails.data.permalink;
//       } catch (error) {
//         console.error("❌ Failed to fetch Instagram post URL:", error.response?.data || error.message);
//         permalink = "Instagram link retrieval failed"; // Prevents crashing
//       }
      
//     }
//     res.json({
//       success: true,
//       post_id: postId,
//       fileUrl: uploadedImages[0],
//       permalink: permalink || "Instagram link retrieval failed",
//     });
    
//   } catch (error) {
//     console.error("Error:", error.response?.data || error.message);
//     res.status(200).json({
//       success: true, // ✅ Still return success, since the post went through
//       message: "Post was published but encountered an error fetching additional details.",
//       fileUrl: uploadedImages[0],
//       permalink: permalink
//     });
//   }
// });

// // ✅ **Start the Express Server**
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Server running on port ${PORT}`);
// });

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const multer = require("multer");
const sharp = require("sharp");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const axios = require("axios");
const crypto = require("crypto");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  exposedHeaders: ["MyFatoorah-Signature", "Authorization", "Content-Type"],
}));

// ✅ **Connect to MongoDB**
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ **Define MongoDB Schema & Model**
const UserSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true },
  fullName: String,
  whatsapp: String,
  email: String,
  images: [String], // Store image URLs instead of files
  caption: String,
  cutCaption: String,
  pricetoPay: String,
  needsPhotography: String,
  status: { type: String, default: "pending" }, // pending → approved → declined
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);

// ✅ **DigitalOcean Spaces Configuration**
const s3 = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
  },
});

// ✅ **Multer Setup for Image Uploads**
const upload = multer({
  storage: multer.memoryStorage(),
}).array("images", 15); // Allows up to 10 images

function flattenAndOrder(obj) {
  let flatArray = [];

  function flatten(prefix, data) {
    if (typeof data === "object" && data !== null) {
      Object.keys(data)
        .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })) // **Sort case-insensitive**
        .forEach((key) => flatten(`${prefix}${key}.`, data[key]));
    } else {
      flatArray.push(`${prefix.slice(0, -1)}=${data ?? ""}`); // **Replace null with ""**
    }
  }

  flatten("", obj);
  return flatArray.join(",");
}

app.get("/user-details", async (req, res) => {
  try {
    const { invoiceId } = req.query;
    if (!invoiceId) {
      return res.status(400).json({ error: "Missing invoice ID" });
    }

    const user = await User.findOne({ invoiceId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("❌ Error fetching user details:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});

app.post("/remove-image", async (req, res) => {
  try {
    const { invoiceId } = req.query;
    if (!invoiceId) {
      return res.status(400).json({ error: "Missing invoiceId" });
    }
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image URL" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { invoiceId },
      { $pull: { images: image } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "Image removed successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error removing image:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/update-caption", async (req, res) => {
  try {
    const { invoiceId } = req.query;
    if (!invoiceId) {
      return res.status(400).json({ error: "Missing invoiceId" });
    }
    const { caption } = req.body;
    if (caption === undefined) {
      return res.status(400).json({ error: "Missing caption" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { invoiceId },
      { $set: { caption } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "Caption updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating caption:", error);
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/get-payment-details", async (req, res) => {
  try {
    const { userId } = req.query; // Use userId instead of invoiceId
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    const user = await User.findById(userId); // Find by _id instead of invoiceId
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      userId: user._id, // Include user ID
      invoiceId: user.invoiceId,
      fullName: user.fullName,
      whatsapp: user.whatsapp,
      email: user.email,
      amount: user.pricetoPay,
      status: user.status,
    });

  } catch (error) {
    console.error("❌ Error fetching user details:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});

app.get("/check-status", async (req, res) => {
  try {
    const { invoiceId } = req.query;
    if (!invoiceId)
      return res.status(400).json({ error: "Missing invoice ID" });

    const user = await User.findOne({ invoiceId });
    if (!user)
      return res.status(404).json({ error: "User not found for invoice ID" });

    res.status(200).json({ invoiceId: user.invoiceId, status: user.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.post("/approve-post", async (req, res) => {
  try {
    const { invoiceId } = req.query;
    if (!invoiceId)
      return res.status(400).json({ error: "Missing invoice ID" });

    const user = await User.findOne({ invoiceId });
    if (!user)
      return res.status(404).json({ error: "User not found for invoice ID" });
    if (user.status === "approved") {
      console.log(`✅ Post already approved for ${user.fullName}`);
      return res.status(200).json({
        msg: "Post already approved"
      });
    }

    user.status = "approved";
    await user.save();

    console.log(`✅ Post Approved for ${user.fullName}`);
    const gallaboxPayload = {
      userData: user
    };

    await axios.post("https://server.gallabox.com/accounts/66fc2e7313caf3280d638167/integrations/genericWebhook/67f28ff92bc18c14d6bd53df/webhook", gallaboxPayload);
    console.log("✅ Sent User Data to Gallabox for Approval");

    const postData = {
      caption: user.caption,
      images: user.images,
    };

    let postId = "";
   

    // 📸 1️⃣ SINGLE IMAGE
    if (postData.images.length === 1) {
      const uploadResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/media`,
        {
          image_url: postData.images[0],
          caption: postData.caption,
          access_token: process.env.ACCESS_TOKEN,
        }
      );

      postId = uploadResponse.data.id;

      await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/media_publish`,
        {
          creation_id: postId,
          access_token: process.env.ACCESS_TOKEN,
        }
      );

    } else {
      // 📸 2️⃣ MULTIPLE IMAGES - Carousel
      const creationIds = [];

      for (const imageUrl of postData.images) {
        const upload = await axios.post(
          `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/media`,
          {
            image_url: imageUrl,
            access_token: process.env.ACCESS_TOKEN,
          }
        );
        creationIds.push(upload.data.id);
      }

      const carouselRes = await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/media`,
        {
          media_type: "CAROUSEL",
          children: creationIds,
          caption: postData.caption,
          access_token: process.env.ACCESS_TOKEN,
        }
      );

      postId = carouselRes.data.id;

      await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/media_publish`,
        {
          creation_id: postId,
          access_token: process.env.ACCESS_TOKEN,
        }
      );
    }

    // 🔗 Fetch permalink
    // try {
    //   const postDetails = await axios.get(
    //     `https://graph.facebook.com/v18.0/${postId}?fields=permalink&access_token=${process.env.ACCESS_TOKEN}`
    //   );
    //   permalink = postDetails.data.permalink;
    // } catch (err) {
    //   console.error(
    //     "❌ Failed to fetch Instagram post URL:",
    //     err.response?.data || err.message
    //   );
    //   permalink = "Instagram link retrieval failed";
    // }

    // ✅ Success Response

    
    res.json({
      success: true,
      post_id: postId,
      fileUrl: postData.images[0],
      // permalink,
    });

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(200).json({
      success: true,
      message:
        "Post was published but encountered an error fetching additional details.",
      fileUrl: "",
      // permalink: "Instagram link retrieval failed",
    });
  }
});

app.post("/reject-post", async (req, res) => {
  try {
    const { invoiceId } = req.query;
    if (!invoiceId) return res.status(400).json({ error: "Missing invoice ID" });

    // 1️⃣ Find user by invoiceId
    const user = await User.findOne({ invoiceId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // 2️⃣ Check if refund is valid
    if (user.status !== "paid") {
      return res.status(400).json({ error: "User is not eligible for a refund" });
    }

    console.log(`❌ Rejecting Post for ${user.fullName}`);

    // 3️⃣ Refund payload
    const refundPayload = {
      Key: invoiceId,
      KeyType: "invoiceId",
      Amount: parseFloat(user.pricetoPay), // Ensure it's a number
      Comment: "Post rejected, refund initiated",
      Reason: "Post did not meet approval criteria",
    };

    // 4️⃣ Make refund request
    const refundResponse = await axios.post(
      "https://apitest.myfatoorah.com/v2/MakeRefund",
      refundPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.MYFATOORAH_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!refundResponse.data.IsSuccess) {
      console.error("❌ Refund Failed:", refundResponse.data);
      return res.status(500).json({ error: "Failed to process refund" });
    }

    console.log(`💰 Refund Successful for ${user.fullName}`);

    if (user.status === "rejected") {
      console.log(`✅ Post already rejected for ${user.fullName}`);
      return res.status(200).json({
        msg: "Post already rejected"
      });
    }

    // 5️⃣ Update status
    user.status = "rejected";
    await user.save();

        // Send to Gallabox for approval
        const gallaboxPayload = {
          userData: user
        };
    
        await axios.post("https://server.gallabox.com/accounts/66fc2e7313caf3280d638167/integrations/genericWebhook/67f28fec93d15f3bcb718844/webhook", gallaboxPayload);
        console.log("✅ Sent to Gallabox for Approval");

    // ✅ Respond
    res.json({
      success: true,
      message: "Post rejected & refund processed!",
      refundDetails: refundResponse.data.Data,
      redirectUrl: `/rejected?invoiceId=${invoiceId}`,
    });

  } catch (error) {
    console.error("❌ Error rejecting post:", error.response?.data || error);
    res.status(500).json({ error: "Failed to reject post" });
  }
});

app.get("/get-users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("❌ Error Fetching Users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/get-rate-limit", async (req, res) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_BUSINESS_ID}/content_publishing_limit`;
    
    const response = await axios.get(url, {
      params: {
        access_token: process.env.ACCESS_TOKEN, // You need to provide this
      },
    });

    res.jsonrdesacd8
     // Send the actual data
    console.log("✅ Rate Limit Response:", response.data);
  } catch (error) {
    console.error("❌ Error Fetching Limit:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch rate limit" });
  }
});


app.post("/upload-images", upload, async (req, res) => {
  const uploadedImages = [];


  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded." });
    }

    const caption = req.body.caption || "Posted via Gopass";
   

    // Process each image
    for (const file of req.files) {
      const STANDARD_WIDTH = 1080;
      const STANDARD_HEIGHT = 1080;

      // Resize image
      const resizedImageBuffer = await sharp(file.buffer)
        .resize(STANDARD_WIDTH, STANDARD_HEIGHT, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      // Get updated image dimensions
      const metadata = await sharp(resizedImageBuffer).metadata();
      const { width, height } = metadata;

      // Watermark with gradient
      const fontSize = Math.max(Math.floor(width * 0.03), 15);
      const textSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.ceil(
        fontSize * 2.5
      )}">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="black" stop-opacity="0"/>
            <stop offset="50%" stop-color="black" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="black" stop-opacity="1"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${Math.ceil(
        fontSize * 2.5
      )}" fill="url(#gradient)"/>
        <text x="20" y="${Math.floor(
          fontSize * 1.8
        )}" font-family="Arial" font-size="${fontSize}" fill="white">
          Posted via
          <tspan font-weight="bold"> Gopass</tspan>
        </text>
      </svg>`;

      const textBuffer = Buffer.from(textSvg);

      // Overlay watermark
      const watermarkedImage = await sharp(resizedImageBuffer)
        .composite([
          {
            input: textBuffer,
            top: height - Math.ceil(fontSize * 2.5),
            left: 20,
          },
        ])
        .toFormat("jpeg")
        .toBuffer();

      // Generate filename
      const filename = `uploads/${Date.now()}-${file.originalname.replace(
        /\s/g,
        "-"
      )}`;

      // Upload to DigitalOcean Spaces
      const uploadParams = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: filename,
        Body: watermarkedImage,
        ACL: "public-read",
        ContentType: "image/jpeg",
      };

      await s3.send(new PutObjectCommand(uploadParams));

      const fileUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${filename}`;
      console.log("Image uploaded:", fileUrl);
      uploadedImages.push(fileUrl);
    }

    res.json({ success: true, imageUrls: uploadedImages  });
  } catch (error) {
    console.error("❌ Error uploading images:", error);
    res.status(500).json({ error: "Failed to upload images" });
  }
});

app.post("/save-user-info", async (req, res) => {
  try {
    const { fullName, whatsapp, email, images, caption, price, pricetoPay, cutCaption, needsPhotography } = req.body;

    if (
      !fullName ||
      !whatsapp ||
      !caption ||
      !price ||
      !cutCaption ||
      (needsPhotography === "no" && (!images || images.length === 0))
    ) {
      return res.status(400).json({ error: "All fields are required!" });
    }
    
    const formattedWhatsapp = whatsapp.replace(/\D/g, "").slice(-8); // Extract last 8 digits

    if (formattedWhatsapp.length > 11) {
      return res.status(400).json({ error: "Invalid phone number format!" });
    }


    // 1️⃣ Save User First with a Temporary Invoice ID
    const newUser = new User({
      invoiceId: `temp_${Date.now()}`, // Temporary ID
      fullName,
      whatsapp,
      email,
      images,
      caption,
      cutCaption,
      price,
      pricetoPay,
      needsPhotography,
      status: "pending",
    });

    await newUser.save(); // Save initial user data

    // 2️⃣ Generate MyFatoorah Invoice
    const invoicePayload = {
      InvoiceValue: parseFloat(pricetoPay),
      CustomerName: fullName,
      CustomerEmail: email || "no-email@example.com",
      CustomerMobile: formattedWhatsapp,
      UserDefinedField: newUser._id.toString(), // Use user ID for tracking
      CallBackUrl: `https://autosport965mine.netlify.app/success-paid?userId=${newUser._id}`,
      ErrorUrl: `https://autosport965mine.netlify.app/payment-failed?userId=${newUser._id}`,
      Language: "English",
      DisplayCurrencyIso: "KWD",
    };

    const invoiceResponse = await axios.post(
      "https://apitest.myfatoorah.com/v2/ExecutePayment",
      {
        PaymentMethodId: "2",
        InvoiceValue: invoicePayload.InvoiceValue,
        CustomerName: invoicePayload.CustomerName,
        DisplayCurrencyIso: invoicePayload.DisplayCurrencyIso,
        CallBackUrl: invoicePayload.CallBackUrl,
        ErrorUrl: invoicePayload.ErrorUrl,
        MobileCountryCode: invoicePayload.MobileCountryCode,
        CustomerMobile: invoicePayload.CustomerMobile,
        CustomerEmail: invoicePayload.CustomerEmail,
        UserDefinedField: invoicePayload.UserDefinedField,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MYFATOORAH_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const invoiceId = invoiceResponse.data.Data.InvoiceId;
    const paymentUrl = invoiceResponse.data.Data.PaymentURL;

    // 3️⃣ Update User with the Correct `invoiceId`
    await User.findByIdAndUpdate(newUser._id, { invoiceId });

    res.status(201).json({
      success: true,
      message: "User info saved!",
      paymentUrl,
    });

  } catch (error) {
    console.error("❌ Error Saving User Info:", error.response?.data || error);
    res.status(500).json({ error: "Failed to save user information", error });
  }
});

app.get("/api/retry-payment", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Format the user's WhatsApp number
    const formattedWhatsapp = user.whatsapp.replace(/\D/g, "").slice(-8);

    // Build the invoice payload using the user data
    const invoicePayload = {
      InvoiceValue: parseFloat(user.pricetoPay),
      CustomerName: user.fullName,
      CustomerEmail: user.email || "no-email@example.com",
      CustomerMobile: formattedWhatsapp,
      UserDefinedField: user._id.toString(), // Use user id for tracking
      CallBackUrl: `https://autosport965mine.netlify.app/success-paid?userId=${user._id}`,
      ErrorUrl: `https://autosport965mine.netlify.app/payment-failed?userId=${user._id}`,
      Language: "English",
      DisplayCurrencyIso: "KWD",
    };

    // Call the MyFatoorah API to create a new invoice
    const invoiceResponse = await axios.post(
      "https://apitest.myfatoorah.com/v2/ExecutePayment",
      {
        PaymentMethodId: "2",
        InvoiceValue: invoicePayload.InvoiceValue,
        CustomerName: invoicePayload.CustomerName,
        DisplayCurrencyIso: invoicePayload.DisplayCurrencyIso,
        CallBackUrl: invoicePayload.CallBackUrl,
        ErrorUrl: invoicePayload.ErrorUrl,
        CustomerMobile: invoicePayload.CustomerMobile,
        CustomerEmail: invoicePayload.CustomerEmail,
        UserDefinedField: invoicePayload.UserDefinedField,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MYFATOORAH_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const invoiceId = invoiceResponse.data.Data.InvoiceId;
    const paymentUrl = invoiceResponse.data.Data.PaymentURL;

    // Update user with the new invoiceId (and paymentUrl if desired)
    await User.findByIdAndUpdate(user._id, { invoiceId, paymentUrl });

    res.status(200).json({
      success: true,
      message: "New invoice created!",
      paymentUrl,
    });
  } catch (error) {
    console.error("❌ Error creating new invoice:", error.response?.data || error);
    res.status(500).json({ error: "Failed to create new invoice", details: error.message });
  }
});


app.all("/payment-callback", async (req, res) => {
  try {
    console.log("✅ Received Webhook Data:", JSON.stringify(req.body, null, 2));

    if (!req.body || Object.keys(req.body).length === 0) {
      console.warn("⚠️ No webhook data received.");
      return res.status(200).json({ success: true, message: "Empty webhook received." });
    }

    const { EventType, Event, DateTime, CountryIsoCode, Data = {} } = req.body;

    const InvoiceId = Data?.InvoiceId || null;
    const PaymentId = Data?.PaymentId || null;
    const UserDefinedField = Data?.UserDefinedField || null;
    const TransactionStatus = Data?.TransactionStatus || null;

    if (!InvoiceId || !PaymentId || !UserDefinedField || !TransactionStatus) {
      console.warn("⚠️ Missing required fields.");
      return res.status(200).json({ success: true, message: "Missing required fields." });
    }

    // ✅ Check if status is not paid
    if (TransactionStatus.toUpperCase() !== "SUCCESS") {
      console.warn(`⚠️ Payment not successful. Status: ${TransactionStatus}`);
      return res.status(200).json({ success: true, message: "Payment not successful." });
    }

    console.log(`✅ Payment Verified! Invoice ID: ${InvoiceId}, Payment ID: ${PaymentId}`);

    const user = await User.findOneAndUpdate(
      { _id: UserDefinedField },
      { status: "paid" },
      { new: true }
    );

    if (!user) {
      console.warn("⚠️ User not found.");
      return res.status(200).json({ success: true, message: "User not found." });
    }

    console.log("✅ User Payment Status Updated:", user.fullName);

    const gallaboxPayload = {
      userData: user,
      actions: {
        approve: `https://gopass-backend.onrender.com/approve-post?invoiceId=${user.invoiceId}`,
        decline: `https://gopass-backend.onrender.com/reject-post?invoiceId=${user.invoiceId}`,
      },
    };

    const webhookUrl =
    user.images && user.images.length > 0
      ? "https://server.gallabox.com/accounts/66fc2e7313caf3280d638167/integrations/genericWebhook/67f28fcad1b4c62f8731435e/webhook"
      : "https://server.gallabox.com/accounts/66fc2e7313caf3280d638167/integrations/genericWebhook/67f28fdeb3440b7aeef12319/webhook";
  
  await axios.post(webhookUrl, gallaboxPayload);

    console.log("✅ Sent to Gallabox for Approval");

    res.status(200).json({ success: true, message: "Payment verified & sent for approval!" });
  } catch (error) {
    console.error("❌ Payment Verification Error:", error.message);
    res.status(200).json({ success: true, message: "Webhook received but failed internally." });
  }
});



// ✅ **Start the Express Server**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
