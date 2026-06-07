importPackage(Packages.com.sk89q.worldedit);
importPackage(Packages.com.sk89q.worldedit.math);
importPackage(Packages.com.sk89q.worldedit.blocks);
importPackage(Packages.com.sk89q.worldedit.session);
importPackage(Packages.com.sk89q.worldedit.regions);
importPackage(Packages.com.sk89q.worldedit.extent.clipboard);
context.checkArgs(1, 3, "<rotateY> [rotateX] [rotateZ] [-a]");
var blocks = context.remember();
var session = context.getSession();
var clipBoardHolder = session.getClipboard();
var clipBoard = clipBoardHolder.getClipboard();
var player = context.getPlayer();
var region = clipBoard.getRegion();
var minP = region.getMinimumPoint();
var maxP = region.getMaximumPoint();
var vector3At;
var blockVectorAt;
var isWorldEdit7 = true;
try {
    Vector3.at(0, 0, 0);
    vector3At = function (x, y, z) { return Vector3.at(x, y, z); }
    blockVectorAt = function (x, y, z) { return BlockVector3.at(x, y, z); }
} catch (e) {
    isWorldEdit7 = false;
    vector3At = function (x, y, z) { return new Vector(x, y, z); }
    blockVectorAt = function (x, y, z) { return new Vector(x, y, z).toBlockVector(); }
}
var vector3 = function (pos) {
    if (pos.toVector3) return pos.toVector3();
    if (pos.toVector) return pos.toVector();
    return pos;
}
var blockPoint = function (pos) {
    if (pos.toBlockPoint) return pos.toBlockPoint();
    if (pos.toBlockVector) return pos.toBlockVector();
    return pos;
}
var getPlayerBlockLocation = function () {
    if (player.getBlockLocation) return blockPoint(vector3(player.getBlockLocation()));
    if (player.getPosition) return blockPoint(vector3(player.getPosition()));
    return blockPoint(vector3(player.getLocation()));
}
var isAir = function (block) {
    if (!isWorldEdit7) return block.getId() == 0;
    return block.toString() == "minecraft:air" || block.toString() == "minecraft:cave_air";
}
var deg2rad = Math.PI / 180;
var yy = !isNaN(argv[1]) ? -argv[1] * deg2rad : 0;
var xx = !isNaN(argv[2]) ? argv[2] * deg2rad : 0;
var zz = !isNaN(argv[3]) ? argv[3] * deg2rad : 0;
var ignoreAir = false;
if (argv[1] == "-a" || argv[2] == "-a" || argv[3] == "-a" || argv[4] == "-a") {
    ignoreAir = true;
}
var cx = Math.cos(xx), cy = Math.cos(yy), cz = Math.cos(zz);
var sx = Math.sin(xx), sy = Math.sin(yy), sz = Math.sin(zz);
// deal y axis with facing change, clamp dfacing to 0-3
var dfacing = (Math.round(yy / Math.PI * 2) + 40000) % 4;
var changeDir = function (block) {
    if (!dfacing) return block;
    if (!isWorldEdit7) {
        var rotated = new BaseBlock(block);
        for (var i = 0; i < dfacing; i++) rotated.rotate90Reverse();
        return rotated;
    }
    var str = block.toString();
    if (str.match(/facing=/)) {
        switch (dfacing) {
            case 1: return context.getBlock(str.replace("axis=x", "axis=@z").replace("axis=z", "axis=@x").replace("south", "eas@t").replace("west", "south").replace("north", "west").replace("east", "north").replace("@", ""));
            case 2: return context.getBlock(str.replace("south", "nor@th").replace("east", "wes@t").replace("north", "sout@h").replace("west", "eas@t").replace("@", ""));
            case 3: return context.getBlock(str.replace("axis=x", "axis=@z").replace("axis=z", "axis=@x").replace("south", "wes@t").replace("east", "south").replace("north", "east").replace("west", "north").replace("@", ""));
        }
    } else {
        return block;
    }
}
// Euler角转矩阵，顺序：my.mx.mz
var matrix = [
    cy * cz + sx * sy * sz, -cz * sx * sy + cy * sz, cx * sy,
    -cx * sz, cx * cz, sx,
    -cz * sy + cy * sx * sz, -cy * cz * sx - sy * sz, cx * cy
];
// var matrix = [
//     cy * cz - sx * sy * sz, cx * sz, cz * sy + cy * sx * sz,
//     -cz * sx * sy - cy * sz, cx * cz, cy * cz * sx - sy * sz,
//     -cx * sy, -sx, cx * cy
// ];
var rotfn = function (vIn) {
    return vector3At(
        vIn.getX() * matrix[0] + vIn.getY() * matrix[1] + vIn.getZ() * matrix[2],
        vIn.getX() * matrix[3] + vIn.getY() * matrix[4] + vIn.getZ() * matrix[5],
        vIn.getX() * matrix[6] + vIn.getY() * matrix[7] + vIn.getZ() * matrix[8]
    );
};
var rotinvfn = function (vIn) {
    return vector3At(
        vIn.getX() * matrix[0] + vIn.getY() * matrix[3] + vIn.getZ() * matrix[6],
        vIn.getX() * matrix[1] + vIn.getY() * matrix[4] + vIn.getZ() * matrix[7],
        vIn.getX() * matrix[2] + vIn.getY() * matrix[5] + vIn.getZ() * matrix[8]
    );
};
// rot: R(x-b) + b + (b' - b) => Rx + (b' - Rb) => offset = b' - Rb
var offset = vector3(getPlayerBlockLocation()).subtract(
    rotfn(vector3(clipBoard.getOrigin()))
);
var ps = [
    vector3At(minP.getX(), minP.getY(), minP.getZ()),
    vector3At(maxP.getX(), minP.getY(), minP.getZ()),
    vector3At(minP.getX(), maxP.getY(), minP.getZ()),
    vector3At(maxP.getX(), maxP.getY(), minP.getZ()),
    vector3At(minP.getX(), minP.getY(), maxP.getZ()),
    vector3At(maxP.getX(), minP.getY(), maxP.getZ()),
    vector3At(minP.getX(), maxP.getY(), maxP.getZ()),
    vector3At(maxP.getX(), maxP.getY(), maxP.getZ())
];
// calculate new AABB
var nminX = Infinity, nmaxX = -Infinity;
var nminY = Infinity, nmaxY = -Infinity;
var nminZ = Infinity, nmaxZ = -Infinity;
for (var i = 0; i < 8; i++) {
    var p = rotfn(ps[i]);
    nminX = Math.min(nminX, p.getX()); nmaxX = Math.max(nmaxX, p.getX());
    nminY = Math.min(nminY, p.getY()); nmaxY = Math.max(nmaxY, p.getY());
    nminZ = Math.min(nminZ, p.getZ()); nmaxZ = Math.max(nmaxZ, p.getZ());
}
nminX += offset.getX(); nmaxX += offset.getX() + 1;
nminY += offset.getY(); nmaxY += offset.getY() + 1;
nminZ += offset.getZ(); nmaxZ += offset.getZ() + 1;
for (var x = nminX; x <= nmaxX; x++) {
    for (var y = nminY; y <= nmaxY; y++) {
        for (var z = nminZ; z <= nmaxZ; z++) {
            var oldP = blockPoint(rotinvfn(vector3At(x, y, z).subtract(offset)));
            if (region.contains(oldP)) {
                var oldBlock = clipBoard.getBlock(oldP);
                if (!(ignoreAir && isAir(oldBlock))) {
                    blocks.setBlock(blockVectorAt(x, y, z), changeDir(oldBlock));
                }
            }
        }
    }
}
player.print("Rotated and Pasted");
