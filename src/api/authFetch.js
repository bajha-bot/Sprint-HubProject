import { getToken } from '../constants/apiToken';

export const authFetch = async (url, options = {}) => {
  const token = await getToken();

  if (!token) throw new Error("Unauthorized");

  return fetch(`http://localhost:5000/api/employees`, {
    // ...options,
    // mode: 'cors',
    // headers: {
    //   ...options.headers,
    //   'Content-Type': 'application/json',
    //   AppToken: token,
    // },
  });
};







// import { getToken } from '../constants/apiToken';

// export const authFetch = async (url, options = {}) => {
//   const token = await getToken();

//   if (!token) throw new Error("Unauthorized");

//   return fetch(url, {
//     ...options,
//     mode: 'cors',
//     headers: {
//       ...options.headers,
//       'Content-Type': 'application/json',
//       AppToken: token,
//     },
//   });
// };