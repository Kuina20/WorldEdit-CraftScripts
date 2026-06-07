importPackage(Packages.com.sk89q.worldedit);
importPackage(Packages.com.sk89q.worldedit.math);
importPackage(Packages.com.sk89q.worldedit.blocks);
var blocks = context.remember();
var session = context.getSession();
var player = context.getPlayer();

var vectorAt;
var isWorldEdit7 = true;
try {
    BlockVector3.at(0, 0, 0);
    vectorAt = function (x, y, z) { return BlockVector3.at(x, y, z); }
} catch (e) {
    isWorldEdit7 = false;
    vectorAt = function (x, y, z) { return new Vector(x, y, z); }
}
var blockPoint = function (pos) {
    if (pos.toVector) pos = pos.toVector();
    if (pos.toBlockPoint) return pos.toBlockPoint();
    if (pos.toBlockVector) return pos.toBlockVector();
    return pos;
}
var setStair = function (pos, oldBlock, facing, shape) {
    if (isWorldEdit7) {
        var blc_str = String(oldBlock).split("[");
        var half = /half=(bottom|top)(,|\])/.exec(blc_str[1])[1];
        blocks.setBlock(pos, context.getBlock(blc_str[0] + "[facing=" + facing + ",shape=" + shape + ",half=" + half + "]"));
        return;
    }

    // In Minecraft 1.12 stair shape is calculated by the game; metadata stores facing and half.
    var facingData = { east: 0, west: 1, south: 2, north: 3 };
    var data = oldBlock.getData();
    blocks.setBlock(pos, new BaseBlock(oldBlock.getId(), (data & 4) | facingData[facing]));
}
var blockTypeKey = function (block) {
    return isWorldEdit7 ? String(block).split("[")[0] : String(block.getId());
}

var search_line = function (origin, distance) {
    var line_blc_type = blockTypeKey(blocks.getBlock(origin));
    var lines = [];
    var lines_string = [];
    var shape = "straight";
    var is_online = function (o, dir) {
        var pos = o.add(dir);
        if (lines_string.indexOf(String(pos)) != -1) return false;
        return blockTypeKey(blocks.getBlock(pos)) == line_blc_type;
    }
    var dir = vectorAt(1, 0, 0);
    if (blockTypeKey(blocks.getBlock(origin.subtract(dir))) == line_blc_type) {
        dir = vectorAt(-1, 0, 0);
    }
    var dx = dir.getX(), dz = dir.getZ();
    var up = vectorAt(0, 1, 0);
    var down = vectorAt(0, -1, 0);
    for (var i = 0; i < distance; i++) {
        lines.push(origin);
        lines_string.push(String(origin));
        player.print(dx + "," + dz);
        var left = vectorAt(dz, 0, -dx);
        var right = vectorAt(-dz, 0, dx);
        var straight = vectorAt(dx, 0, dz);
        if (is_online(origin, left.add(up))) {
            dir = left.add(up);
            shape = "inner_right";
        } else if (is_online(origin, left)) {
            dir = left;
            shape = "inner_right";
        } else if (is_online(origin, left.add(down))) {
            dir = left.add(down);
            shape = "inner_right";
        } else if (is_online(origin, straight.add(up))) {
            dir = straight.add(up);
            shape = "straight";
        } else if (is_online(origin, straight)) {
            dir = straight;
            shape = "straight";
        } else if (is_online(origin, straight.add(down))) {
            dir = straight.add(down);
            shape = "straight";
        } else if (is_online(origin, right.add(up))) {
            dir = right.add(up);
            shape = "outer_left";
        } else if (is_online(origin, right)) {
            dir = right;
            shape = "outer_left";
        } else if (is_online(origin, right.add(down))) {
            dir = right.add(down);
            shape = "outer_left";
        } else {
            break;
        }
        dx = dir.getX();
        dz = dir.getZ();

        origin = origin.add(dir);
        var facing = dx == -1 ? "north" : dx == 1 ? "south" : dz == 1 ? "west" : dz == -1 ? "east" : "";
        setStair(lines[i], blocks.getBlock(lines[i]), facing, shape);
    }
    return lines;
}
var distance = (Math.min(argv[3], 400) || 400);
var lines = search_line(blockPoint(player.getBlockOn()), distance);
// for (var i in lines)
//     blocks.setBlock(lines[i], context.getBlock(String(blocks.getBlock(lines[i])).split("[")[0] + "[facing=west]"));
