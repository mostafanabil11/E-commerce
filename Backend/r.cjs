const mongoose=require('mongoose'),bcrypt=require('bcrypt'),fs=require('fs');
const env=fs.readFileSync('config/dev.env','utf8');
const uri=env.split('\n').find(l=>l.startsWith('DB_URI')).split('=').slice(1).join('=').trim().replace(/^"|"$/g,'');
(async()=>{await mongoose.connect(uri,{serverSelectionTimeoutMS:20000});
const c=mongoose.connection.db.collection('users');
await c.updateOne({email:'resetrepro@example.com'},{$set:{forgotPasswordOTP:await bcrypt.hash('111222',12),forgotPasswordOTPExpires:new Date(Date.now()+600000)}});
const u=await c.findOne({email:'resetrepro@example.com'},{projection:{resetCodeVerified:1,forgotPasswordOTPExpires:1}});
console.log('planted 111222 | resetCodeVerified now =',u.resetCodeVerified);
await mongoose.disconnect();})().catch(e=>{console.error(e.message);process.exit(1)});
