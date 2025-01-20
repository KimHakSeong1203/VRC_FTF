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


