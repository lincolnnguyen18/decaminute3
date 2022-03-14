if ! screen -list | grep -q 'd3'; then
  echo 'd3 already killed'
  exit 1
else
  echo "killing d3"
fi
. /media/sda1/deployment/ports.sh
screen -S 'd3' -X quit
echo "Checking if d3 still alive..."
lsof -i:$d3