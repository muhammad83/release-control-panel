var nextProductKey = 1;

export default class Product
{
    constructor(name)
    {
        this.key = nextProductKey++;
        this.name = name;
    }
}