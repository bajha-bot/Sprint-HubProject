import { createSlice } from "@reduxjs/toolkit";


const initialState = {link:''}

export const openFileSlice = createSlice({
    name:'Open Sheets',
    initialState,
    reducers:{
        openFileLink(state,action){
            state.link = action.payload
        }, 
        
        
    }
})

export const {openFileLink} = openFileSlice.actions
export default openFileSlice.reducer