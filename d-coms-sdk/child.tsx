import React, { useEffect } from "react";

export const Child: React.FC<{ a:string, pushFunc:(newEvent:()=>void) => void }> = ({
a,pushFunc
}) => {
    const childEvent = () => {
        console.log("on click child",a)
    }
    useEffect(() => {
        pushFunc(childEvent);
    }, [pushFunc,childEvent])
    return <div>
        child
    </div>
}