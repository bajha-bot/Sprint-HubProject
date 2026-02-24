import { createSlice } from "@reduxjs/toolkit";

// import { useLocation } from "react-router-dom";

// integrate here to see for the link and decide the initial state value 
const location = window.location.pathname
let stateValue
if(location === '/browse'){
stateValue = 2
}
else if(location === '/search'){
stateValue = 1
}
else if(location === '/manage'){
stateValue = 3
}else{
    stateValue=0
}
const initialState = {value:stateValue}

export const navbarSlice = createSlice({
    name:'Navbar State',
    initialState,
    reducers:{
        changeNavbarState(state,action){
            state.value = action.payload
        }
    }
})

export const {changeNavbarState} = navbarSlice.actions
export default navbarSlice.reducer