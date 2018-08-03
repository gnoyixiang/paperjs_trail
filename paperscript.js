paper.install(window);

let items = [];
let paths = [];

let intersectionGroup = null;

let alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
let connections = ["AB", "AC", "BD", "BE", "CG", "DF", "EG", "FG"];

let rectBounds = ["leftCenter", "rightCenter", "topCenter", "bottomCenter"];

let selectedItem = null;
let hasMovedItem = false;
let move_vector = null;

let iterationCount = 0;
let intervalID = null;
let iterationStart = null;
let iterationEnd = null;

/*--------------------- start window events ---------------------*/

window.onload = function () {
    paper.setup('myCanvas');
    for (let i = 0; i < alphabet.length; ++i) {
        let x = 100 + 150 * i;
        let y = 100;

        let item =
            new Group([
                Path.Rectangle({
                    point: [x, y],
                    size: [100, 100],
                    fillColor: 'white',
                    strokeColor: 'black'
                }),

                new PointText({
                    point: [x + 20, y + 20],
                    content: alphabet[i],
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fillColor: 'black',
                    fontWeight: 'bold'
                })

            ]);

        items.push(item);

        item.onMouseDown = function (event) {
            makeSelection(event.currentTarget);
            //get the vector between mouse point and item position
            move_vector = selectedItem.position.subtract(event.point);
        };
    }
    makeConnections(items, connections);
};

window.onmouseup = function (event) {
    if (selectedItem) {
        selectionChange(items, selectedItem);
    }
    if (hasMovedItem) {
        removeMovedItem();
    }
    //unassign selected item upon mouse up
    selectedItem = null;
}

window.onmousemove = function (event) {
    // get movement vector of mouse
    movement_vector = new Point(event.movementX, event.movementY);
    //check if mouse down event triggered and movement vector magnitude > 1
    if (selectedItem && movement_vector.length > 1) {
        hasMovedItem = true;
        selectedItem.position = new Point(event.x, event.y).add(move_vector);
        makeConnections(items, connections);
        highlightNeighbours(items, selectedItem);
    }
}

window.ondblclick = function (event) {
    if (event.target.id != "myCanvas") return;
    iterationStart = new Date();
    // show loader
    document.getElementById("loader").style.visibility = "visible";
    intervalID = window.setInterval(function () {
        moveItems();
        // get time elapsed
        let now = new Date();
        let timeElapsed = (now - iterationStart) / 1000
        document.getElementById("timeElapsed").innerHTML = iterationCount + " tries in " + Math.round(timeElapsed) + "s";
    }, 0);
}

/*--------------------- end window events ---------------------*/

/*--------------------- functions list ---------------------*/

function selectionChange(items, selectedItem) {
    if (selectedItem.firstChild.selected) {
        if (!hasMovedItem) {
            selectedItem.firstChild.selected = false;
            unhighlightAll(items);
        }
    } else {
        for (let i = 0; i < items.length; ++i) {
            items[i].firstChild.selected = false;
        }
        selectedItem.firstChild.selected = true;
        highlightNeighbours(items, selectedItem);
    }

}
function unhighlightAll(items) {
    for (let i = 0; i < items.length; ++i) {
        items[i].firstChild.fillColor = "white";
    }
}

function highlightNeighbours(items, selectedItem) {
    nearestItem = null;

    nearestElement = items.reduce(function (a, b) {
        if (a == selectedItem) { return b; }
        if (b == selectedItem) { return a; }

        vector_a = a.position.subtract(selectedItem.position);
        vector_b = b.position.subtract(selectedItem.position);

        return vector_a.length < vector_b.length ? a : b;
    });

    nearestDistance = nearestElement.position.subtract(selectedItem.position).length;

    for (let i = 0; i < items.length; ++i) {
        if (items[i].position.subtract(selectedItem.position).length <= nearestDistance * 1.2) {
            items[i].firstChild.fillColor = "yellow";
        } else {
            items[i].firstChild.fillColor = "white";
        }
        selectedItem.firstChild.fillColor = "white";
    }
}

function makeSelection(item) {
    selectedItem = item;
    highlightNeighbours(items, selectedItem);
}

function removeMovedItem() {
    //reset item moved variables
    hasMovedItem = false;
    move_vector = null;
}

function makeConnections(items, connections, snap = true) {
    if (paths) {
        for (let i = 0; i < paths.length; ++i) {
            paths[i].remove();
        }
        paths = [];
    }
    for (let i = 0; i < connections.length; ++i) {
        firstAlphabetIndex = alphabet.indexOf(connections[i][0]);
        secondAlphabetIndex = alphabet.indexOf(connections[i][1]);
        connect(items[firstAlphabetIndex], items[secondAlphabetIndex], snap);
    }
}
function connect(item1, item2, snap) {
    if (snap) {
        connection = getConnectionPoints(item1, item2);
        point1 = connection.item1;
        point2 = connection.item2;
    } else {
        point1 = item1.bounds.rightCenter;
        point2 = item2.bounds.leftCenter;
    }

    var vector = point2.subtract(point1);
    vector = vector.normalize(10);

    vectorItem = new Group([
        new Path([point1, point2]),
        new Path([
            point2,
            point2.add(vector)
        ]).rotate(160, point2),
        new Path([
            point2,
            point2.add(vector)
        ]).rotate(-160, point2)
    ]);
    vectorItem.strokeColor = "black";

    paths.push(vectorItem);
}
function getConnectionPoints(item1, item2) {
    let possibleConnections = [];
    for (let i = 0; i < rectBounds.length; i++) {
        for (let j = 0; j < rectBounds.length; j++) {
            possibleConnections.push({
                item1: item1.bounds[rectBounds[i]],
                item2: item2.bounds[rectBounds[j]]
            });
        }
    }
    let connectionDistances = possibleConnections.map(function (conn) {
        return conn.item1.subtract(conn.item2).length;
    });
    let minDistance = connectionDistances.reduce(function (a, b) {
        return a < b ? a : b;
    })
    let connectionIndex = connectionDistances.indexOf(minDistance);
    return possibleConnections[connectionIndex];
}

function clonePaths(pathsGroup, items, paths) {
    for (let i = 0; i < items.length; ++i) {
        pathsGroup.push(items[i].firstChild.clone());
    }
    for (let i = 0; i < paths.length; ++i) {
        pathsGroup.push(paths[i].firstChild.clone());
    }
}

function removeClonedPaths(pathsGroup) {
    for (let i = 0; i < pathsGroup.length; ++i) {
        pathsGroup[i].remove();
    }
}

function hasIntersections(pathsGroup) {
    intersectionGroup = [];
    for (let i = 0; i < pathsGroup.length; ++i) {
        for (let j = i + 1; j < pathsGroup.length; ++j) {
            intersections = pathsGroup[i].getIntersections(pathsGroup[j]);
            if (intersections.length > 0) {
                for (let n = 0; n < intersections.length; n++) {
                    if (verifyIntersection(intersections[n], pathsGroup[i], pathsGroup[j])) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function verifyIntersection(intersection, pathsGroup1, pathsGroup2) {
    let verify1 = true;
    let verify2 = true;

    function testIntersection(intersection, pathsGroup) {
        return pathsGroup.segments.every(function (segment) {
            return segment.point.subtract(intersection.point).length > 0
        })
    }

    if (!pathsGroup1.closed) {
        verify1 = testIntersection(intersection, pathsGroup1)
    }
    if (!pathsGroup2.closed) {
        verify2 = testIntersection(intersection, pathsGroup2)
    }
    return verify1 && verify2;
}

function moveItems() {
    let myCanvas = document.getElementById("myCanvas");
    let myCanvasStartPoint = new Point(myCanvas.offsetLeft + 120, myCanvas.offsetTop + 120);
    let myCanvasSize = new Point(myCanvas.offsetWidth - 200, myCanvas.offsetHeight - 200);

    for (let i = 0; i < items.length; i++) {
        items[i].position = myCanvasStartPoint.add(Point.random().multiply(myCanvasSize));
    }
    makeConnections(items, connections);
    if (!hasIntersections(getPathsGroup(items, paths))) {
        clearInterval(intervalID);
        intervalID = null;
        let selectedIndex = getSelectedIndex(items);
        if (selectedIndex != -1) {
            highlightNeighbours(items, items[selectedIndex]);
        }
        document.getElementById("loader").style.visibility = "hidden";
        iterationCount = 0;
        return;
    }
    console.log("iterationCount", ++iterationCount);
}

function getSelectedIndex(items) {
    for (let i = 0; i < items.length; i++) {
        if (items[i].selected) return i;
    }
    return -1;
}

function getPathsGroup(...pathItems) {
    let pathsGroup = [];
    for (let i = 0; i < pathItems.length; i++) {
        for (let j = 0; j < pathItems[i].length; j++)
            pathsGroup.push(pathItems[i][j].firstChild);
    }
    return pathsGroup;
}
