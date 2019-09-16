set -e
yarn run build
cd dist
git init
git add -A
git commit -m 'deploy'
git remote add origin https://github.com/panda098/hackujstat2019.git
git push origin HEAD:gh-pages
cd -
