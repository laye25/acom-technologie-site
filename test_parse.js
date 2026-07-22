console.log(parseFloat(undefined) ?? 0);
console.log(parseFloat("2000") ?? 0);
console.log(isNaN(parseFloat(undefined)) ? 0 : parseFloat(undefined));
