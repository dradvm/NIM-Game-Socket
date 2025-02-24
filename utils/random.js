const Color = {
    red: "#ff2400",
    yellow: "#fdff00",
    green: "#76ff7a",
    blue: "#33BFFF",
    purple: "#7b68ee"
}

const random = (n = 3) => {
    return Math.floor(Math.random() * n) + 1;
}

const Random = {
    randomColor: (n = 0) => {
        var number = random(5)
        if (n != 0) {
            number = n % 5 + 1
        }

        switch (number) {
            case 1: {
                return Color.red
            }
            case 2: {
                return Color.yellow
            }
            case 3: {
                return Color.green
            }
            case 4: {
                return Color.blue
            }
            case 5: {
                return Color.purple
            }
            default: {
                return "#FFFFFF"
            }
        }
    },
    randomShape: (n = 0) => {
        var number = random()

        if (n != 0) {
            number = n % 3 + 1
        }

        switch (number) {
            case 1: {
                return "circle"
            }
            case 2: {
                return "triangle"
            }
            case 3: {
                return "square"
            }
            default: {
                return "none"
            }
        }
    },

    randomNumber: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}


module.exports = Random