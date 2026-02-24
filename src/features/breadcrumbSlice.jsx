import { createSlice } from "@reduxjs/toolkit";

const initialState ={value:'Select a File'}

export const breadcrumbSlice = createSlice({
    name:'Breadcrumb Path',
    initialState,
    reducers:{
        changeBreadcrumb(state,action){
            state.value = action.payload;
        }
    }
})

export const {changeBreadcrumb} = breadcrumbSlice.actions
export default breadcrumbSlice.reducer