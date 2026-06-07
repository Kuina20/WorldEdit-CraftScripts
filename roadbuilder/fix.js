importPackage(Packages.com.sk89q.worldedit);
importPackage(Packages.com.sk89q.worldedit.math);
importPackage(Packages.com.sk89q.worldedit.blocks);
var blocks = context.remember();
var session = context.getSession();
var player = context.getPlayer();

// WorldEdit 6 uses Vector, while WorldEdit 7 uses BlockVector3.
var vectorAt;
try {
    BlockVector3.at(0, 0, 0);
    vectorAt = function (x, y, z) {
        return BlockVector3.at(x, y, z);
    }
} catch (e) {
    vectorAt = function (x, y, z) {
        return new Vector(x, y, z);
    }
}

var getBlockOn = function () {
    var origin = player.getBlockOn();
    if (origin.toVector) origin = origin.toVector();
    if (origin.toBlockPoint) return origin.toBlockPoint();
    if (origin.toBlockVector) return origin.toBlockVector();
    return origin;
}

var search_line = function (origin, isLeft, distance) {
    var aim_blc_type = blocks.getBlock(origin);
    var line_blc_type = String(aim_blc_type);
    var lines = [];
    var lines_string = [];
    var shape = "straight";

    var up = vectorAt(0, 1, 0);
    var down = vectorAt(0, -1, 0);
    var is_online = function (o, dir) {
        var pos = o.add(dir);
        if (lines_string.indexOf(String(pos)) != -1) return false;
        if (String(blocks.getBlock(pos.add(up))) == line_blc_type) return false;
        return String(blocks.getBlock(pos)) == line_blc_type;
    }
    var dir = vectorAt(1, 0, 0);
    if (String(blocks.getBlock(origin.subtract(dir))) == line_blc_type) {
        dir = vectorAt(-1, 0, 0);
    }
    var dx = dir.getX(), dz = dir.getZ();
    for (var i = 0; i < distance; i++) {
        lines.push(origin);
        lines_string.push(String(origin));
        var left = vectorAt(dz, 0, -dx);
        var right = vectorAt(-dz, 0, dx);
        var straight = vectorAt(dx, 0, dz);
        var skewleft = left.add(straight);
        var skewright = right.add(straight);
        if (is_online(origin, left.add(up))) {
            dir = left.add(up);
        } else if (is_online(origin, left)) {
            dir = left;
        } else if (is_online(origin, left.add(down))) {
            dir = left.add(down);
        } else if (is_online(origin, straight.add(up))) {
            dir = straight.add(up);
        } else if (is_online(origin, straight)) {
            dir = straight;
        } else if (is_online(origin, straight.add(down))) {
            dir = straight.add(down);
        } else if (is_online(origin, right.add(up))) {
            dir = right.add(up);
        } else if (is_online(origin, right)) {
            dir = right;
        } else if (is_online(origin, right.add(down))) {
            dir = right.add(down);
        } else if (is_online(origin, skewleft.add(up))) {
            if (isLeft == "r") {
                blocks.setBlock(origin.add(straight.add(up)), aim_blc_type);
                origin = origin.add(straight.add(up));
                dir = left;
            } else {
                blocks.setBlock(origin.add(left), aim_blc_type);
                origin = origin.add(left);
                dir = straight.add(up);
            }

            lines_string.push(String(origin));

        } else if (is_online(origin, skewleft)) {
            if (isLeft == "r") {
                blocks.setBlock(origin.add(straight), aim_blc_type);
                origin = origin.add(straight);
                dir = left;
            } else {
                blocks.setBlock(origin.add(left), aim_blc_type);
                origin = origin.add(left);
                dir = straight;
            }

            lines_string.push(String(origin));
        } else if (is_online(origin, skewleft.add(down))) {
            if (isLeft == "r") {
                blocks.setBlock(origin.add(straight.add(down)), aim_blc_type);
                origin = origin.add(straight.add(down));
                dir = left;
            } else {
                blocks.setBlock(origin.add(left), aim_blc_type);
                origin = origin.add(left);
                dir = straight.add(down);
            }
            lines_string.push(String(origin));
        } else if (is_online(origin, skewright.add(up))) {
            if (isLeft == "l") {
                blocks.setBlock(origin.add(straight.add(up)), aim_blc_type);
                origin = origin.add(straight.add(up));
                dir = right;
            } else {
                blocks.setBlock(origin.add(right), aim_blc_type);
                origin = origin.add(right);
                dir = straight.add(up);
            }
            lines_string.push(String(origin));
        } else if (is_online(origin, skewright)) {
            if (isLeft == "l") {
                blocks.setBlock(origin.add(straight), aim_blc_type);
                origin = origin.add(straight);
                dir = right;
            } else {
                blocks.setBlock(origin.add(right), aim_blc_type);
                origin = origin.add(right);
                dir = straight;
            }
            lines_string.push(String(origin));
        } else if (is_online(origin, skewright.add(down))) {
            if (isLeft == "l") {
                blocks.setBlock(origin.add(straight.add(down)), aim_blc_type);
                origin = origin.add(straight.add(down));
                dir = right;
            } else {
                blocks.setBlock(origin.add(right), aim_blc_type);
                origin = origin.add(right);
                dir = straight.add(down);
            }
            lines_string.push(String(origin));
            // } else if (is_online(origin, down)) {
            //     origin = origin.add(down);
            //     blocks.setBlock(origin, context.getBlock("air"));
            // } else if (is_online(origin, up)) {
            //     origin = origin.add(up);
            //     blocks.setBlock(origin, context.getBlock("air"));
        } else {
            // player.print(origin);
            break;
        }
        dx = dir.getX();
        dz = dir.getZ();

        origin = origin.add(dir);
        if (is_online(origin, vectorAt(0, -1, 0))) {
            lines_string.push(String(origin.add(vectorAt(0, -1, 0))));
        }
    }
    return lines;
}
var distance = (Math.min(argv[2], 400) || 400);
var isLeft = argv[1];
var lines = search_line(getBlockOn(), isLeft, distance);
player.print("路径总长"+lines.length+"个方块");
