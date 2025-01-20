const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:8080', // Vue 앱의 URL
  credentials: true, // 쿠키를 포함하여 요청을 보냄
}));

app.post('/api/auth', async (req, res) => {
  try {
    const { username, password } = req.body;
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await axios.get('https://api.vrchat.cloud/api/1/auth/user', {
      headers: {
        'User-Agent': 'MyApplication/1.0',
        Authorization: `Basic ${auth}`,
      },
    });
    res.setHeader('Set-Cookie', response.headers['set-cookie']);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Server Error' });
  }
});

app.post('/api/email', async (req, res) => {
  try {
    const { code } = req.body;
  console.log('req.headers.cookie', req.headers.cookie);
  
  const otpResponse = await axios.post(
    `https://api.vrchat.cloud/api/1/auth/twofactorauth/totp/verify`,
    { code: code.trim() },
    {
      headers: {
        'User-Agent': 'MyApplication/1.0',
        'Cookie': req.headers.cookie,
      },
    }
  );

  console.log('otpResponse', otpResponse.data);
  

  console.log('2FA 인증 성공');

  const cookies = otpResponse.headers['set-cookie'];
  console.log('cookies', cookies);

  let twoFactorAuthCookie = '';

  if (cookies) {
    // 'auth'와 'twoFactorAuth' 쿠키 값을 추출
    cookies.forEach(cookie => {
      if (cookie.startsWith('twoFactorAuth=')) {
        twoFactorAuthCookie = cookie.split(';')[0];
      }
    });
  }
  // console.log('Auth Cookie:', req.headers.cookie ?? null);
  // console.log('2FA Cookie:', twoFactorAuthCookie);

  const userResponse = await axios.get(`https://api.vrchat.cloud/api/1/auth/user`, {
    headers: {
      'User-Agent': 'MyApplication/1.0',
      'Cookie': `${req.headers.cookie};${twoFactorAuthCookie}`,
    },
    // 쿠키를 자동으로 처리하기 위해 withCredentials 설정
    withCredentials: true,
  });
  if(!userResponse.data.friends.length) {
    throw new Error("인증번호가 틀렸습니다.");
  }
  console.log('전체 친구 수', userResponse.data.friends?.length)

  // // 2FA 인증 성공 후 친구 목록 가져오기
  // const friendsResponse = await axios.get(
  //   `https://api.vrchat.cloud/api/1/auth/user/friends?offline=true`,
  //   {
  //     headers: {
  //       'User-Agent': 'MyApplication/1.0',
  //       'Cookie': `${req.headers.cookie};${twoFactorAuthCookie}`,
  //     },
  //   }
  // );

  let data; // 데이터를 저장할 변수 선언
  try {
    const friendsResponse = await axios.get(`https://api.vrchat.cloud/api/1/auth/user/friends?offline=true`, {
      headers: {
        'User-Agent': 'MyApplication/1.0',
        'Cookie': `${req.headers.cookie};${twoFactorAuthCookie}`,
      },
    });

    data = friendsResponse.data; // 비동기 호출 완료 후 데이터 할당
    const friendNames = [];
    // 데이터가 배열인 경우 처리
    let friendCounter = 0;
    data.forEach((friend) => {
      friendCounter++;
      console.log(friend.displayName);
      friendNames.push(friend.displayName)
    });
      res.json({friendNames, code: 200})
    } catch (error) {
      if (error.response) {
        console.error('Response Error:', error.response.data);
      } else {
        console.error('Request Error:', error.message);
      }
    }
  } catch (error) {
    console.error(error);
    
    res.json({code: 400});
  } finally {
    return;
  }
})

app.listen(3000, () => {
  console.log('프록시 서버가 3000 포트에서 실행 중입니다.');
});


// const axios = require('axios');
// const readline = require('readline');

// // 터미널 입력 설정
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// (async () => {
//   try {
//     const auth = Buffer.from(`palap523:khs1203!@`).toString('base64');
//     console.log('auth', auth);
    
//   //   const userResponse = await axios.get(`https://api.vrchat.cloud/api/1/auth/user`, {
//   //     headers: {
//   //       'User-Agent': 'MyApplication/1.0',
//   //       'Authorization': `Basic ${auth}`,
//   //     },
//   //     // 쿠키를 자동으로 처리하기 위해 withCredentials 설정
//   //     withCredentials: true,
//   //   });

//   //   // 응답에서 'set-cookie' 헤더를 확인하여 쿠키 값 추출
//   //   const cookies = userResponse.headers['set-cookie'];
//   //   let authCookie = '';
//   //   let twoFactorAuthCookie = '';
//   //   console.log('cookies', cookies);
    
//   //   if (cookies) {
//   //     // 'auth' 쿠키 값을 추출
//   //     cookies.forEach(cookie => {
//   //       if (cookie.startsWith('auth=')) {
//   //         authCookie = cookie.split(';')[0];
//   //       }
//   //     });
//   //   }

//   //   console.log('Auth Cookie:', authCookie);

//   //   // 쿠키가 모두 포함되었는지 확인
//   //   if (authCookie) {
//   //     console.log('이메일 OTP가 필요합니다.');

//   //     // 사용자로부터 OTP 입력받기
//   //     rl.question('OTP 코드를 입력하세요: ', async (otpCode) => {
      
          

//   //       } catch (error) {
//   //         console.error('OTP 인증 실패:', error.response?.data || error.message);
//   //       } finally {
//   //         rl.close();
//   //       }
//   //     });
//   //   } else {
//   //     console.error('쿠키가 없거나 유효하지 않습니다.');
//   //     rl.close();
//   //   }
//   } catch (error) {
//     if (error.response) {
//       console.error('Response Error:', error.response.data);
//     } else {
//       console.error('Request Error:', error.message);
//     }
//   //   rl.close();
//   }
// })();





// // (async () => {
// //   let data; // 데이터를 저장할 변수 선언
// //   try {
// //     const response = await axios.get(`https://api.vrchat.cloud/api/1/auth/user/friends?offline=true`, {
// //       headers: {
// //         'User-Agent': 'MyApplication/1.0',
// //         'Cookie': 'auth=authcookie_080f6682-14b1-421e-bd8a-5a7e575199f3; twoFactorAuth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c3JfNDhjZGVlMjktZmZiYy00YTZjLThlOTEtMDVmMDgwOGNhNTU3IiwibWFjQWRkcmVzcyI6IiIsInRpbWVzdGFtcCI6MTczNjgxNDkzODU3MywidmVyc2lvbiI6MSwiaWF0IjoxNzM2ODE0OTM4LCJleHAiOjE3Mzk0MDY5MzgsImF1ZCI6IlZSQ2hhdFR3b0ZhY3RvckF1dGgiLCJpc3MiOiJWUkNoYXQifQ.xN1AO5Fdp1Tjs0r0JShf90US8K3hC44nPRQgFGQ7xXU',
// //       },
// //     });

// //     data = response.data; // 비동기 호출 완료 후 데이터 할당

// //     // 데이터가 배열인 경우 처리
// //     let friendCounter = 0;
// //     data.forEach((friend) => {
// //       friendCounter++;
// //       console.log(friend.displayName);
// //     });
// //     console.log('친구:', friendCounter);
// //   } catch (error) {
// //     if (error.response) {
// //       console.error('Response Error:', error.response.data);
// //     } else {
// //       console.error('Request Error:', error.message);
// //     }
// //   }
// // })();


