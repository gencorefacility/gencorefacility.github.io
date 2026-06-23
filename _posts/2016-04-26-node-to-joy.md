---
layout: post
title: "Node to Joy: Maximize Your Performance on the HPC"
date: 2016-04-26
author: "Mohammed Khalfan"
featured_image: /assets/images/blog/L1_Lobby.jpg
header_image: /assets/images/header-blog.jpg
comments: true
---

In this post we'll discuss maximizing your performance on the HPC. This entry is aimed towards experienced HPC users; for new users, please see [Getting Started on the HPC](https://wikis.nyu.edu/display/NYUHPC/High+Performance+Computing+at+NYU).

Recent advances in sequencing technology have made High Performance Computing (HPC) more critical than ever in data-driven biological research. NYU's HPC resources are available to all NYU faculty, staff, and faculty-sponsored students.

Familiarizing yourself with NYU's HPC resources, and optimizing your use of this technology will enable maximum speed and efficiency in your analyses.

**Get to Know Your Nodes**

Mercer, the primary NYU HPC cluster in New York, contains 400 nodes, 16TB of total memory, and over 3200 CPU cores. When a job is submitted to the cluster, one or more nodes are allocated to the job based on the resources requested when submitting. Typically, a single node is sufficient, and the node will be allocated based on amount of memory and CPU cores requested.

For example, of the 400 nodes available on Mercer, 112 of them are 64GB nodes with 20 CPU cores available per node. Note that 64GB is the total memory per node but **62GB is the amount of memory available to jobs**. Therefore, if 64GB of memory is requested, the job will run on the next largest memory node. In this case, the node will be allocated based on how many processors per node (cores) are requested. There are twelve 96GB nodes with 12 cores on Mercer, so if 12 or less cores are requested, a 96GB node will be allocated. If 20 cores are requested, the next highest memory nodes with 20 cores are forty eight 192GB nodes (189GB available for jobs), so one of these nodes will be allocated. See [list of Mercer nodes](https://wikis.nyu.edu/display/NYUHPC/Clusters). There are also four new nodes with 500GB available memory and 20 CPU cores, and two new nodes with 1.5TB memory and 48 CPU cores, that are not included in this list.

Generally speaking, if 20 CPU cores on a single compute node is requested, it is ok to declare 62GB memory. If more than 62GB memory with 20 CPU cores on a single compute node is needed, it is ok to declare 189GB memory. In the above cases, since 20 cores are being requested, no one would be able to share the compute node (since all CPU cores are being used) and so it would be efficient to request all the available memory there.

**Which Node is Right for your Analysis?**

Choosing the right node for your analysis requires a little benchmarking and testing. Over-requesting resources when they are not needed might result in your analyses taking longer because of queues for the higher resource nodes since they are fewer of these. For example, a job which may have spawned almost immediately after submission on a lower resource node and taken 30 minutes to run might have taken less time to complete on a 1TB node, but the queue time for this job might have been longer since there are only 3 nodes with 1TB memory available.

It can be difficult to know what resources are required for a particular job and this only comes with experience. Enabling email notifications in your pbs scripts (with the directive `#PBS -M NetID@nyu.edu`) is very helpful as well because it allows you to get notifications about compute resources used after a job is complete. These reports can guide resource requests for future jobs.

Finally, if you plan on running an application with multiple CPU cores, for example:

```bash
bowtie2 -p 20 -x <ref> -U <input.fq>
```

Ensure that you request this number of CPU cores when submitting your PBS job, as such:

```bash
#PBS -l nodes=1:ppn=20,mem=62GB,walltime=12:00:00
```

The bottom line: the time to complete a job on the HPC is a function of **BOTH** the queue time and the compute time. So, consider both when setting up your jobs.

To learn how to see which jobs are currently running on which nodes and cores visit: [https://wikis.nyu.edu/display/NYUHPC/Interpreting+pbstop](https://wikis.nyu.edu/display/NYUHPC/Interpreting+pbstop)

For more information on running jobs on the NYU HPC cluster visit: [https://wikis.nyu.edu/display/NYUHPC/Running+jobs+on+the+NYU+HPC+clusters](https://wikis.nyu.edu/display/NYUHPC/Running+jobs+on+the+NYU+HPC+clusters)
