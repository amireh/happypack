import b = require("./b.ts");
import c = require("./c.ts");

class Greeter {
    constructor(public greeting: string) { }
    greet() {
        return "<h1>" + this.greeting + "</h1>";
    }
};

var greeter = new Greeter("Hello, world! b=" + b + " c=" + c);
const foobar = 'zxc';

console.log( greeter.greet() );