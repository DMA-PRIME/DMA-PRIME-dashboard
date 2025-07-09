#!/bin/bash

#SBATCH --job-name DMA-PRIME-data-processing
#SBATCH --partition=dmaprime
#SBATCH --nodes 1
#SBATCH --ntasks 1
#SBATCH --cpus-per-task 1
#SBATCH --mem 4gb
#SBATCH --time 02:00:00
#SBATCH --output=/dev/null
#SBATCH --error=/dev/null

cd /project/liorr/dmaprime/visualization_data/scripts

errors=0
error_file="logs/output_log_$(printf '%(%Y-%m-%d)T\n' -1).txt"
touch "$error_file"

# write new key
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python << EOF
import secrets
with open("/project/liorr/dmaprime/visualization_data/download/supplementary/encrypt_key.bin", "wb") as f:
    f.write(secrets.randbits(256).to_bytes(32, 'big'))
EOF

# backup
backup_dir="/project/liorr/dmaprime/visualization_data/backup/$(printf '%(%Y-%m-%d)T\n' -1)"

mkdir $backup_dir

echo "Backing Up" >> $error_file
cp -rp "/project/liorr/dmaprime/visualization_data/raw" $backup_dir &>> $error_file

mkdir -p "$backup_dir/aggregated/waste_water"
cp -rp "/project/liorr/dmaprime/visualization_data/aggregated/waste_water/CDC_running_data_4plot.xlsx" "$backup_dir/aggregated/waste_water/CDC_running_data_4plot.xlsx" &>> $error_file

cp -rp "/project/liorr/dmaprime/visualization_data/aggregated/other_diseases" "$backup_dir/aggregated/" &>> $error_file

cp -rp "/project/liorr/dmaprime/visualization_data/aggregated/respiratory" "$backup_dir/aggregated/" &>> $error_file

# encrypt hospital & mhc files
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python encrypt.py /project/liorr/dmaprime/visualization_data/download/supplementary/encrypt_key.bin "/project/liorr/dmaprime/visualization_data/supplementary/Health Care Facilities/processed/" "/project/liorr/dmaprime/visualization_data/download/supplementary/Health Care Facilities/"

# move new raw/aggregated data
echo >> $error_file
echo "Getting waste water data from box" >> $error_file
./globus-http-linux-amd64-0.1.2 -config "supporting_files/config.toml" download "https://g-471022.581c1.0ec8.data.globus.org/CDC_running_data_4plot.xlsx" ../aggregated/waste_water/CDC_running_data_4plot.xlsx &>> $error_file
if [ $? -ne 0 ]; then
((errors++))
else
echo "Success" >> $error_file
fi


# run data processing scripts
echo >> $error_file
echo "Processing Data" >> $error_file

echo "Mobile Health Clinics" >> $error_file
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python /project/liorr/dmaprime/visualization_data/scripts/process_mhc.py &>> $error_file
if [ $? -ne 0 ]; then
((errors++))
else
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python encrypt.py "/project/liorr/dmaprime/visualization_data/download/supplementary/encrypt_key.bin" "/project/liorr/dmaprime/visualization_data/processed/mhc" "/project/liorr/dmaprime/visualization_data/download/processed/mhc" &>> $error_file
# cp -rp "/project/liorr/dmaprime/visualization_data/processed/mhc" "/project/liorr/dmaprime/visualization_data/download/processed"
echo "Success" >> $error_file
fi

echo "Opioid, HCV, HIV" >> $error_file
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python /project/liorr/dmaprime/visualization_data/scripts/process_opioid_hcv_hiv.py &>> $error_file
if [ $? -ne 0 ]; then
((errors++))
else
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python encrypt.py "/project/liorr/dmaprime/visualization_data/download/supplementary/encrypt_key.bin" "/project/liorr/dmaprime/visualization_data/processed/opioid_hcv_hiv" "/project/liorr/dmaprime/visualization_data/download/processed/opioid_hcv_hiv"
# cp -rp "/project/liorr/dmaprime/visualization_data/processed/opioid_hcv_hiv" "/project/liorr/dmaprime/visualization_data/download/processed"
echo "Success" >> $error_file
fi

echo "Other Infectious Diseases" >> $error_file
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python /project/liorr/dmaprime/visualization_data/scripts/process_other_infectious_diseases_data.py &>> $error_file
if [ $? -ne 0 ]; then
((errors++))
else
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python encrypt.py "/project/liorr/dmaprime/visualization_data/download/supplementary/encrypt_key.bin" "/project/liorr/dmaprime/visualization_data/processed/other_infectious_diseases" "/project/liorr/dmaprime/visualization_data/download/processed/other_infectious_diseases"
# cp -rp "/project/liorr/dmaprime/visualization_data/processed/other_infectious_diseases" "/project/liorr/dmaprime/visualization_data/download/processed"
echo "Success" >> $error_file
fi

echo "Respiratory" >> $error_file
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python /project/liorr/dmaprime/visualization_data/scripts/process_respiratory_hospitalizations.py &>> $error_file
if [ $? -ne 0 ]; then
((errors++))
else
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python encrypt.py "/project/liorr/dmaprime/visualization_data/download/supplementary/encrypt_key.bin" "/project/liorr/dmaprime/visualization_data/processed/respiratory" "/project/liorr/dmaprime/visualization_data/download/processed/respiratory"
# cp -rp "/project/liorr/dmaprime/visualization_data/processed/respiratory" "/project/liorr/dmaprime/visualization_data/download/processed"
echo "Success" >> $error_file
fi

echo "Waste Water" >> $error_file
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python /project/liorr/dmaprime/visualization_data/scripts/process_waste_water_data.py &>> $error_file
if [ $? -ne 0 ]; then
((errors++))
else
/project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python encrypt.py "/project/liorr/dmaprime/visualization_data/download/supplementary/encrypt_key.bin" "/project/liorr/dmaprime/visualization_data/processed/waste_water" "/project/liorr/dmaprime/visualization_data/download/processed/waste_water"
# cp -rp "/project/liorr/dmaprime/visualization_data/processed/waste_water" "/project/liorr/dmaprime/visualization_data/download/processed"
echo "Success" >> $error_file
fi

echo "Num errors: $errors" >> $error_file

# email results
# if [ errors -gt 0 ]; then
python3 sendmail.py gausten@clemson.edu "DMA-PRIME Data Processing Log" "$(cat $error_file)"
# fi

