export const copy = function (obj){
    return JSON.parse(JSON.stringify(obj))
}

import {handlePropertyName} from './symbols'
export const copyHandleObj=function (obj){
    let obj_copy={}
    function findHandle(obj,obj_copy){
        // console.log(obj,obj_copy)
        Object.getOwnPropertyNames(obj).forEach(i=>{
            obj_copy[i]={
                [handlePropertyName]:obj[i][handlePropertyName],
                children:{}
            }
           
            findHandle(obj[i].children,obj_copy[i].children)
        })
    }
    findHandle(obj,obj_copy)
    return  obj_copy
}