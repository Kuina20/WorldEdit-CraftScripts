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
        incoming,
        vectorAt(incoming.getZ(), 0, -incoming.getX()),
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
var cutLength = Number(argv[2]);
var spacing = argv[3] === undefined ? cutLength : Number(argv[3]);
var maxDistance = 10000;

if (!material ||
    !isFinite(cutLength) || cutLength < 1 || Math.floor(cutLength) != cutLength ||
    !isFinite(spacing) || spacing < 1 || Math.floor(spacing) != spacing) {
    player.printError("用法: /cs cut <切断材料> <切断长度> [间隔]");
    player.printError("示例: /cs cut 0 2（保留2格、切断2格）");
    player.printError("示例: /cs cut 0 2 5（保留5格、切断2格）");
} else {
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

    // Every two adjacent corner blocks form one logical unit. A longer run is
    // split into pairs, and a final unpaired corner forms its own unit.
    var corner = [];
    for (var i = 0; i < path.length; i++) corner[i] = false;
    for (var i = 1; i < path.length - 1; i++) {
        var incoming = horizontal(path[i].subtract(path[i - 1]));
        var outgoing = horizontal(path[i + 1].subtract(path[i]));
        corner[i] = !sameDirection(incoming, outgoing);
    }

    var units = [];
    for (var i = 0; i < path.length; i++) {
        if (corner[i]) {
            var cornerUnit = [path[i]];
            if (i + 1 < path.length && corner[i + 1]) {
                i++;
                cornerUnit.push(path[i]);
            }
            units.push(cornerUnit);
        } else {
            units.push([path[i]]);
        }
    }

    var aimBlock = context.getBlock(material);
    var cutCount = 0;
    var changedCount = 0;
    for (var u = spacing; u < units.length; u += spacing + cutLength) {
        var cutEnd = Math.min(u + cutLength, units.length);
        cutCount++;
        for (var cutUnit = u; cutUnit < cutEnd; cutUnit++) {
            var unit = units[cutUnit];
            for (var b = 0; b < unit.length; b++) {
                blocks.setBlock(unit[b], aimBlock);
                changedCount++;
            }
        }
    }

    player.print(
        "路径共" + path.length + "个方块（按转角合并后" + units.length +
        "格），每保留" + spacing + "格切断" + cutLength + "格，共切断" +
        cutCount + "次，替换" + changedCount + "个方块"
    );
}
