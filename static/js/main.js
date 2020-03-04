$(function(){ 

    function myFunctionCallingFunction(functionArg){
        functionArg();
    };

    myFunctionCallingFunction(function(){
        console.log("hi there");
    });

    myFunctionCallingFunction(function(){
        console.log("number 2");
    });

    
    (function(something){
        console.log(something);
    })("asfdsada");
});