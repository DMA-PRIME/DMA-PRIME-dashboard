#!/bin/bash

#SBATCH --job-name DMA-PRIME-other-disease-data-processing
#SBATCH --partition=dmaprime
#SBATCH --nodes 1
#SBATCH --ntasks 1
#SBATCH --cpus-per-task 1
#SBATCH --mem 4gb
#SBATCH --time 00:20:00
#SBATCH --output=/dev/null
#SBATCH --error=/dev/null

cd /project/liorr/dmaprime/visualization_data/scripts

# download to temp
./globus-http-linux-amd64-0.1.2 -config "supporting_files/config.toml" download "https://g-471022.581c1.0ec8.data.globus.org/CDC_running_data_4plot.xlsx" temp.xlsx >> temp.txt

if [ $? -ne 0 ]; then
python3 sendmail.py gausten@clemson.edu "DMA-PRIME Waste Water Data Download Errors" "$(cat temp.txt)"
else
# check if new
cmp $(ls -td ../backup/* | head -1)/aggregated/waste_water/CDC_running_data_4plot.xlsx temp.xlsx
case $? in
  0) # same file
    # delete temp
    rm temp.xlsx
    ;;
  1) # new file
    ;&
  2) # or one of the files doesn't exist
  # backup
    backup_dir="/project/liorr/dmaprime/visualization_data/backup/$(printf '%(%Y-%m-%d)T\n' -1)"
    mkdir -p "$backup_dir/aggregated/waste_water"
    cp -rp "/project/liorr/dmaprime/visualization_data/aggregated/waste_water/CDC_running_data_4plot.xlsx" "$backup_dir/aggregated/waste_water/CDC_running_data_4plot.xlsx"
  # move new file to aggregated
    mv temp.xlsx ../aggregated/waste_water/CDC_running_data_4plot.xlsx
  # process
    /project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python /project/liorr/dmaprime/visualization_data/scripts/process_waste_water_data.py >> temp.txt
    if [ $? -ne 0 ]; then
      python3 sendmail.py gausten@clemson.edu "DMA-PRIME Waste Water Data Processing Errors" "$(cat temp.txt)"
    else
    # encrypt
      /project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python encrypt.py "/project/liorr/dmaprime/visualization_data/download/supplementary/encrypt_key.bin" "/project/liorr/dmaprime/visualization_data/processed/waste_water" "/project/liorr/dmaprime/visualization_data/download/processed/waste_water"
      python3 sendmail.py gausten@clemson.edu "DMA-PRIME Waste Water Data" "Successfully updated"
    fi
    ;;
esac

rm temp.txt
fi