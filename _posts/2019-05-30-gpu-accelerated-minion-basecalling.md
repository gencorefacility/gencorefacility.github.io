---
layout: post
title: "GPU-Accelerated MinION Basecalling On the HPC"
date: 2019-05-30
author: "Mohammed Khalfan"
featured_image: /assets/images/blog/R2Q.jpg
header_image: /assets/images/header-blog.jpg
comments: true
---

I recently helped the Rockman lab basecall their MinION sequencing data on the Prince HPC, leveraging the power of the GPUs available there. This allowed us to bring the total time required for basecalling down to around five hours, from the **two weeks(!)** it was going to take on the desktop.

Since more people are beginning to perform MinION sequencing here at the [Center for Genomics and Systems Biology](http://as.nyu.edu/cgsb), I thought it would be helpful to share the procedure for basecalling with GPUs on the HPC.

First, you'll need to transfer your data to the HPC. I recommend rsync for this if you're on a mac. If you're using Windows, I suggest WinSCP. You'll also need to know the flowcell and kit that was used for sequencing (see [this table](#available-flowcell--kit-combinations) for the full list of options), and lastly the output path where you want the basecalled fastq files to go.

Copy the script below to your local directory, modify the first four parameters shown in red (leave `--device "auto"` intact), then submit it to Slurm like this: `sbatch script-name.s`

If you have multiple fast5 directories (for example: fast5_pass and fast5_skip), you can combine the fast5 files into one directory, or you can run the script twice, providing a different input path each time.

{% gist mohammedkhalfan/ebfe4f26de7e222bd4cabe166f0f0c12 %}

If you're doing RNA sequencing, you need to provide the `--reverse_sequence` argument as well.

The script above should notify you via email when it begins, ends, or if there are any problems, but you can also track it's status using:

`watch squeue -u your_netID`

Questions? E-mail me (mk5636) or post in the comments below.

## Available Flowcell + Kit Combinations

| Flowcell | Kit |
|---|---|
| FLO-MIN106 | SQK-RNA001 |
| FLO-MIN106 | SQK-RNA002 |
| FLO-MIN107 | SQK-RNA001 |
| FLO-MIN107 | SQK-RNA002 |
| FLO-PRO001 | SQK-LSK109 |
| FLO-PRO001 | SQK-DCS109 |
| FLO-PRO001 | SQK-PCS109 |
| FLO-PRO002 | SQK-LSK109 |
| FLO-PRO002 | SQK-DCS109 |
| FLO-PRO002 | SQK-PCS109 |
| FLO-MIN107 | SQK-DCS108 |
| FLO-MIN107 | SQK-DCS109 |
| FLO-MIN107 | SQK-LRK001 |
| FLO-MIN107 | SQK-LSK108 |
| FLO-MIN107 | SQK-LSK109 |
| FLO-MIN107 | SQK-LSK308 |
| FLO-MIN107 | SQK-LSK309 |
| FLO-MIN107 | SQK-LSK319 |
| FLO-MIN107 | SQK-LWP001 |
| FLO-MIN107 | SQK-PCS108 |
| FLO-MIN107 | SQK-PCS109 |
| FLO-MIN107 | SQK-PSK004 |
| FLO-MIN107 | SQK-RAD002 |
| FLO-MIN107 | SQK-RAD003 |
| FLO-MIN107 | SQK-RAD004 |
| FLO-MIN107 | SQK-RAS201 |
| FLO-MIN107 | SQK-RLI001 |
| FLO-MIN107 | VSK-VBK001 |
| FLO-MIN107 | VSK-VSK001 |
| FLO-MIN107 | SQK-LWB001 |
| FLO-MIN107 | SQK-PBK004 |
| FLO-MIN107 | SQK-RAB201 |
| FLO-MIN107 | SQK-RAB204 |
| FLO-MIN107 | SQK-RBK001 |
| FLO-MIN107 | SQK-RBK004 |
| FLO-MIN107 | SQK-RLB001 |
| FLO-MIN107 | SQK-RPB004 |
| FLO-MIN107 | VSK-VMK001 |
| FLO-PRO001 | SQK-RNA002 |
| FLO-PRO002 | SQK-RNA002 |
| FLO-MIN106 | SQK-DCS108 |
| FLO-MIN106 | SQK-DCS109 |
| FLO-MIN106 | SQK-LRK001 |
| FLO-MIN106 | SQK-LSK108 |
| FLO-MIN106 | SQK-LSK109 |
| FLO-MIN106 | SQK-LWP001 |
| FLO-MIN106 | SQK-PCS108 |
| FLO-MIN106 | SQK-PCS109 |
| FLO-MIN106 | SQK-PSK004 |
| FLO-MIN106 | SQK-RAD002 |
| FLO-MIN106 | SQK-RAD003 |
| FLO-MIN106 | SQK-RAD004 |
| FLO-MIN106 | SQK-RAS201 |
| FLO-MIN106 | SQK-RLI001 |
| FLO-MIN106 | VSK-VBK001 |
| FLO-MIN106 | VSK-VSK001 |
| FLO-MIN106 | SQK-RBK001 |
| FLO-MIN106 | SQK-RBK004 |
| FLO-MIN106 | SQK-RLB001 |
| FLO-MIN106 | SQK-LWB001 |
| FLO-MIN106 | SQK-PBK004 |
| FLO-MIN106 | SQK-RAB201 |
| FLO-MIN106 | SQK-RAB204 |
| FLO-MIN106 | SQK-RPB004 |
| FLO-MIN106 | VSK-VMK001 |
