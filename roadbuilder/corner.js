importPackage(Packages.com.sk89q.worldedit);
importPackage(Packages.com.sk89q.worldedit.math);
importPackage(Packages.com.sk89q.worldedit.blocks);

var blocks = context.remember();
var player = context.getPlayer();

// WorldEdit 6 uses Vector, while WorldEdit 7 uses BlockVector3.
var vectorAt;
try {
    BlockVector3.at(0, 0, 0);
    vectorAt = function (x, y, z) { return BlockVector3.at(x, y, z); };
} catch (e) {
    vectorAt = function (x, y, z) { return new Vector(x, y, z); };
}

var blockPoint = function (pos) {
    if (pos.toVector) pos = pos.toVector();
    if (pos.vector) pos = pos.vector();
    if (pos.toBlockPoint) return pos.toBlockPoint();
    if (pos.toBlockVector) return pos.toBlockVector();
    return pos;
};

var key = function (pos) {
    return pos.getX() + "," + pos.getY() + "," + pos.getZ();
};

var horizontal = function (dir) {
    return vectorAt(dir.getX(), 0, dir.getZ());
};

var sameDirection = function (a, b) {
    return a.getX() == b.getX() && a.getZ() == b.getZ();
};

var getNeighbours = function (origin, lineBlock, visited) {
    var neighbours = [];
    var directions = [
        vectorAt(1, 0, 0),
        vectorAt(-1, 0, 0),
        vectorAt(0, 0, 1),
        vectorAt(0, 0, -1)
    ];

    for (var i = 0; i < directions.length; i++) {
        for (var dy = 1; dy >= -1; dy--) {
            var pos = origin.add(directions[i].add(vectorAt(0, dy, 0)));
            if (!visited[key(pos)] && String(blocks.getBlock(pos)) == lineBlock) {
                neighbours.push(pos);
            }
        }
    }
    return neighbours;
};

var chooseNext = function (origin, previous, candidates) {
    if (candidates.length <= 1 || !previous) return candidates[0];

    var incoming = horizontal(origin.subtract(previous));
    var priorities = [
        vectorAt(incoming.getZ(), 0, -incoming.getX()),
        incoming,
        vectorAt(-incoming.getZ(), 0, incoming.getX())
    ];

    for (var p = 0; p < priorities.length; p++) {
        for (var i = 0; i < candidates.length; i++) {
            if (sameDirection(horizontal(candidates[i].subtract(origin)), priorities[p])) {
                return candidates[i];
            }
        }
    }
    return candidates[0];
};

var material = argv[1];
var side = String(argv[2] || "").toLowerCase();
var maxDistance = Math.min(Number(argv[3]) || 400, 400);

if (!material || (side != "l" && side != "left" && side != "r" && side != "right")) {
    player.printError("用法: /cs corner <材料> <l|r> [距离范围]");
} else {
    var chooseRight = side == "r" || side == "right";
    var origin = blockPoint(player.getBlockOn());
    var lineBlock = String(blocks.getBlock(origin));
    var path = [];
    var visited = {};
    var previous = null;
    var current = origin;

    for (var step = 0; step < maxDistance; step++) {
        path.push(current);
        visited[key(current)] = true;

        var candidates = getNeighbours(current, lineBlock, visited);
        if (candidates.length == 0) break;

        var next = chooseNext(current, previous, candidates);
        previous = current;
        current = next;
    }

    var corners = [];
    var cornerKeys = {};
    for (var i = 1; i < path.length - 1; i++) {
        var incoming = horizontal(path[i].subtract(path[i - 1]));
        var outgoing = horizontal(path[i + 1].subtract(path[i]));
        var crossY = incoming.cross(outgoing).getY();
        if (crossY == 0) continue;

        var turnsRight = crossY < 0;
        var corner = chooseRight == turnsRight ? path[i + 1] : path[i];
        if (!cornerKeys[key(corner)]) {
            cornerKeys[key(corner)] = true;
            corners.push(corner);
        }
    }

    var aimBlock = context.getBlock(material);
    for (var c = 0; c < corners.length; c++) {
        blocks.setBlock(corners[c], aimBlock);
    }

    player.print("路径总长" + path.length + "个方块，已替换" + corners.length + "个拐角");
}
