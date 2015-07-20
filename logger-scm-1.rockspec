package = "logger"
version = "scm-1"

source = {
    url = "git@github.com:ivendrov/torch-logger.git"
    branch = 'master'
}

description = {
    summary = "Logging and visualization for Torch model training",
    detailed = [[]],
    homepage = "...",
    license = "MIT"
}

dependencies = {
    "torch >= 7.0",
    "lua-cjson >= 2.1"
}

build = {
   type = "builtin",
   modules = {
        ['logger'] = 'Log.lua'
   }
}