. /media/sda1/deployment/ports.sh
if screen -list | grep -q 'd3'; then
  echo "d3 already started"
  exit 1
else
  echo "starting d3"
fi

screen -dmS 'd3'
screen -S 'd3' -X stuff 'source /media/sda1/deployment/ports.sh\n'
screen -S 'd3' -X stuff 'node .\n'
echo "Checking if d3 started..."
lsof -i:$d3