<template>
  <div>
    <h1>VRChat Friend List</h1>
    <div v-if="isLoading">Loading...</div>
    <div v-else>
      <div v-if="!authCookie">
        <input type="text" v-model="userName" placeholder="Username" />
        <input type="password" v-model="userPassword" placeholder="Password" />
        <button @click="fetchAuthCookie">Login and Fetch Auth Cookie</button>
      </div>
      <div v-else-if="!twoFactorAuthCookie">
        <label for="otp">Enter OTP:</label>
        <input id="otp" v-model="otpCode" placeholder="Enter your OTP" />
        <button @click="verifyOtp">Verify OTP</button>
        <span>{{ twoFactorAuthMessage }}</span>
      </div>
      <div v-else>
        <h2>Friend List</h2>
        <ul>
          <li v-for="friend in friends" :key="friend.id">
            {{ friend }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const userName = ref("");
const userPassword = ref("");
const authCookie = ref(false);
const twoFactorAuthCookie = ref(false);
const twoFactorAuthMessage = ref("");

const otpCode = ref("");
const friends = ref([]);
const isLoading = ref(false);

// 로그인 후 auth 쿠키 가져오기
const fetchAuthCookie = async () => {
  isLoading.value = true;
  try {
    const response = await axios.post(
      "http://localhost:3000/api/auth",
      {
        username: userName.value,
        password: userPassword.value,
      },
      {
        headers: {},
        withCredentials: true, // 쿠키를 자동으로 처리
      }
    );

    // 'set-cookie' 헤더에서 auth 쿠키 추출
    console.log("response.data", response.data);

    if (response.data.requiresTwoFactorAuth) {
      twoFactorAuthCookie.value = false;
      isLoading.value = false;
      authCookie.value = true;
    } else {
      const cookies = response.data["set-cookie"];
      if (cookies) {
        cookies.forEach((cookie) => {
          if (cookie.startsWith("auth=")) {
            authCookie.value = cookie.split(";")[0];
          }
        });
      }
      isLoading.value = false;
      console.log("Auth Cookie:", authCookie.value);
    }
  } catch (error) {
    console.error(
      "Error fetching auth cookie:",
      error.response?.data || error.message
    );
  }
};

// OTP 인증
const verifyOtp = async () => {
  isLoading.value = true;
  try {
    const response = await axios.post(
      "http://localhost:3000/api/email",
      {
        code: otpCode.value.trim(),
      },
      {
        headers: {},
        withCredentials: true, // 쿠키 자동 처리
      }
    );
    if (response.data.code !== 200) {
      throw new Error("인증번호가 일치하지 않습니다.");
    }
    friends.value = response.data;
    twoFactorAuthCookie.value = true;
  } catch (error) {
    twoFactorAuthMessage.value = "인증번호가 일치하지 않습니다.";
    console.error(
      "Error verifying OTP:",
      error.response?.data || error.message
    );
  } finally {
    isLoading.value = false;
  }
};

// 친구 목록 가져오기
// const fetchFriends = async () => {
//   try {
//     const response = await axios.get(
//       "https://api.vrchat.cloud/api/1/auth/user/friends?offline=true",
//       {
//         headers: {
//           "User-Agent": "MyApplication/1.0",
//           Cookie: `${authCookie.value}; ${twoFactorAuthCookie.value}`,
//         },
//         withCredentials: true, // 쿠키 자동 처리
//       }
//     );

//     friends.value = response.data;
//     console.log("Friends:", friends.value);
//   } catch (error) {
//     console.error(
//       "Error fetching friends:",
//       error.response?.data || error.message
//     );
//   }
// };
</script>

<style>
/* Optional styling */
button {
  margin: 10px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
</style>
