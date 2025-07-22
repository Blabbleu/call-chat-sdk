import React, { useState } from "react";
import { Child } from "./child";
export const Parent = ()=>{
    const [clicked,setClicked] = useState(false);
    const [childEvents,setChildEvents] = useState<(() => void)[]>([]);
    const onClickDiv = () =>{
        console.log("trigger parent on click")
        
    };
    const pushChildEvent = (newEvent: ()=>void) =>{
        setChildEvents((prev) => [...prev, newEvent]);
    }
    return <div >
        <Child a = "1" pushFunc = {pushChildEvent} />
        <Child a = "2" pushFunc = {pushChildEvent} />
        abc
        <div onClick={onClickDiv}></div>
    </div>
}