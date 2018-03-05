var app = angular.module("nodeApp", []); 
app.controller("myCtrl", function($scope) {
	$scope.processed_jobs=[];
	$scope.in_process_jobs=[];
	$scope.error_jobs=[];
	$scope.working=false;
	$scope.sub_key="sub-c-037fce1e-0c77-11e8-941f-7e2964818bdb";
	$scope.pubnub = new PubNub({
		subscribeKey: $scope.sub_key,
		ssl: true
	});
	load_resources=function(resources){
		if(resources=='' | resources==null | resources==undefined ) return;
		for (res in resources){
			
		}
	};
	$scope.pubnub.addListener({
		status: function(statusEvent) {
			if (statusEvent.category === "PNConnectedCategory") {
			} else if (statusEvent.category === "PNUnknownCategory") {
				var newState = {
					new: 'error'
				};
				pubnub.setState(
					{
						state: newState 
					},
					function (status) {
						console.log(statusEvent.errorData.message)
					}
				);
			} 
		},
		message: function(message) {
			if($scope.working) {
				load_res(message["message"]['job_id'],message["message"]['host']);
				$scope.get_new_sub_task(message["message"]['job_id'],message["message"]['host']);}

		}
	});
	 
	$scope.pubnub.subscribe({ 
		channels: ['test_project'] 
	});


    $scope.post_result=function(job_name,job_id,arg_id,result,job_time,job_effort,host){
		try {		
			result_success=function(data){
				if (data=true){
					processed_jobs=$("#processed_jobs").html()+"<br>"+job_id;
					$("#processed_jobs").html(processed_jobs);
				}
			};
			$.ajax({
				url: host+"/job/"+job_id+"/result",
				type: "POST",
				data: JSON.stringify({"arg_id":arg_id,"result":result}),
				contentType: "application/json; charset=utf-8",
				success: result_success
			});
			$scope.processed_jobs.push([job_name,job_id,job_time,job_effort]);
			
		}catch(err) {
			$scope.error_jobs.push([job_name,job_id,err]);
			
		}
		$scope.$apply();
	}
	$scope.proc_speed=function(){
		t1 = performance.now();
		sum=0;
		for (i=0;i<1000000;i++) sum=1000*1000;
		t2 = performance.now();
		return 1000000/(t2-t1);
	}
	speed=$scope.proc_speed();
	$scope.get_new_sub_task=function(job_id,host){
		if (!($scope.working)) return;
		success=function(data){
			arg_id=null;
			func=null;
			arg=null;
			if (data==null) {$scope.new_job(host);return;}
			if (data=="") {$scope.new_job(host);return;}
			try {
				data=(data);
				if (data==null) {$scope.new_job(host);return;}
				if (data==undefined) {$scope.new_job(host);return;}
				$scope.no_jobs=false;
				job_name=data['job_name'];
				arg=data["arg"];
				
				arg_id=data["arg_id"];
				func=Function("arg",data["func"]);
				var t1 = performance.now();
				result=func(arg);
				var t2 = performance.now();
				job_time=t2-t1;
				job_effort=(job_time)*speed;

				$scope.post_result(job_name,job_id,arg_id,result,job_time,job_effort,host);
			}catch(err) {
				
				$scope.error_jobs.push([job_name,job_id,err]);
				$.post(host+"/job/"+job_id+"/error",{"arg_id":arg_id},function(){},"json");
				$scope.$apply();
			}
			if($scope.error_jobs.length<20){
				
				setTimeout(function(){
					$scope.get_new_sub_task(job_id,host);}, 5);
			}
			else {
				alert("Stopped because of too many errors. Refresh the page to start processing");
				$scope.working=false;
				$scope.$apply();
			}
			

		}



		$.get(host+'/job/'+job_id,success);		
	}
	$scope.new_job=function(host){
		if (host==undefined) host="http://localhost:3000";
		if (!($scope.working)) return;
		success=function(data){
			if (data==null) {$scope.no_jobs=true;return;}
			if (data=="") {$scope.no_jobs=true;return;}
			if (data==undefined) {$scope.no_jobs=true;return;}
			data=(data);
			if (data==null) {$scope.no_jobs=true;return;}
			if (data=="") {$scope.no_jobs=true;return;}
			if (data==undefined) {$scope.no_jobs=true;return;}	
			load_res(data,host);
			$scope.get_new_sub_task(data,host);
		}
		$.get(host+'/job',success);

	} 
});


