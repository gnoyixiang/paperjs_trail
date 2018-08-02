paper.install(window);


window.onload = function () {
    paper.setup('myCanvas');

    let alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    let connections = ["AB", "AC", "BD", "BE", "CG", "DF", "EG", "FG"];
    let items = [];
    let paths = [];
    let selectedItem = null;
    let movedItem = false;
    let move_vector = null;

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

        item.onMouseDown = function(event){
            console.log("item mousedown");
            makeSelection(event.currentTarget);
                      
            move_vector = selectedItem.position.subtract(event.point);
        };            
    }

    makeConnections(connections);

    function selectionChange(items, selectedItem) {
        console.log("selection changed",selectedItem.firstChild.selected);
        if (selectedItem.firstChild.selected) {  
            console.log("moved item?",movedItem);          
            if (!movedItem) {
                
                selectedItem.firstChild.selected = false;
                unhighlightAll(items);
            }
        } else {
            for(let i=0;i<items.length;++i){
                items[i].firstChild.selected = false;
            } 
            selectedItem.firstChild.selected = true;
            highlightNeighbours(items, selectedItem);
        }
        
    }
    function unhighlightAll(items){
        for(let i=0;i<items.length;++i){
            items[i].firstChild.fillColor="white";
        }
    }

    function highlightNeighbours(items, selectedItem) {
        console.log("highlight");
        nearestItem = null;

        nearestElement = items.reduce(function(a,b){            
            if(a==selectedItem){ return b; }
            if(b==selectedItem){ return a; }
            
            vector_a = a.position.subtract(selectedItem.position);
            vector_b = b.position.subtract(selectedItem.position);

            return vector_a.length < vector_b.length ? a : b; 
        });

        // console.log("nearestElement", nearestElement);
        nearestDistance = nearestElement.position.subtract(selectedItem.position).length;
        // console.log("nearestDistance", nearestDistance);        

        for(let i=0;i<items.length;++i){
            if(items[i].position.subtract(selectedItem.position).length==nearestDistance){
                console.log("item",items[i]);
                items[i].firstChild.fillColor = "yellow";
            } else{
                items[i].firstChild.fillColor = "white";
            }
        }
    }

    function connect(item1, item2) {
        point1 = item1.bounds.rightCenter;
        point2 = item2.bounds.leftCenter;

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

    function makeConnections(connections) {
        // console.log("paths", paths);
        if (paths) {
            for (let i = 0; i < paths.length; ++i) {
                paths[i].remove();
            }
            paths = [];
        }
        for (let i = 0; i < connections.length; ++i) {
            firstAlphabetIndex = alphabet.indexOf(connections[i][0]);
            secondAlphabetIndex = alphabet.indexOf(connections[i][1]);
            connect(items[firstAlphabetIndex], items[secondAlphabetIndex]);
        }
    }

    window.onmouseup = function(event){
        console.log("window mouse up");
        if (selectedItem) { 
            selectionChange(items, selectedItem); 
        }
        if (movedItem) {
            //selectedItem.position = movedItem.position;
            removeMovedItem();
            //makeConnections(connections);
        }
        
        selectedItem = null;
    }

    window.onmousemove = function(event){
        console.log("window mouse moved");
        // if (!movedItem && selectedItem) {
        //     movedItem = selectedItem.clone();
        // }
        movement_vector = new Point(event.movementX,event.movementY);
        // console.log(movement_vector.length);
        if (selectedItem && movement_vector.length>1) {   
            console.log("moved",movement_vector.length)         
            selectedItem.position = new Point(event.x,event.y).add(move_vector);
            makeConnections(connections);
            highlightNeighbours(items,selectedItem);
            movedItem = true;
        }
    }


    function makeSelection(item) {
        selectedItem = item;
        //selectionChange(items,selectedItem);
        highlightNeighbours(items,selectedItem);
    }

    function removeMovedItem() {
        // movedItem.remove();
        movedItem = false;
        move_vector = null;
    }

    

};