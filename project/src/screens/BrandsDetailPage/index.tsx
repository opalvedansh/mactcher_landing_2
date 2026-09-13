import React from "react";
import { View, ScrollView, ImageBackground, Text, Image, TouchableOpacity, } from "react-native";
import {LinearGradient} from 'expo-linear-gradient';
import { SafeAreaView } from "react-native-safe-area-context";
export default (props) => {
	return (
		<SafeAreaView 
			style={{
				flex: 1,
				backgroundColor: "#FFFFFF",
			}}>
			<ScrollView  
				style={{
					flex: 1,
					backgroundColor: "#0F0F0F",
					paddingTop: 36,
				}}>
				<View 
					style={{
						paddingTop: 15,
						marginBottom: 21,
					}}>
					<View >
						<View 
							style={{
								marginBottom: 6,
							}}>
							<View >
								<ImageBackground 
									source={{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/08386c12-3f49-42a9-92e5-06445b7314e5"}} 
									resizeMode = {'stretch'}
									>
									<LinearGradient 
										start={{x:0, y:1}}
										end={{x:0, y:0}}
										colors={["#0F0F0F00", "#0F0F0F"]}
										style={{
											height: 115,
											marginBottom: 196,
										}}>
									</LinearGradient>
									<LinearGradient 
										start={{x:0, y:1}}
										end={{x:0, y:0}}
										colors={["#0F0F0F00", "#0F0F0F"]}
										style={{
											alignItems: "center",
											paddingTop: 72,
											paddingBottom: 19,
											paddingLeft: 137,
										}}>
										<Text 
											style={{
												color: "#FCFCFC",
												fontSize: 36,
												fontWeight: "bold",
												marginBottom: 9,
												width: 164,
											}}>
											{"Ordinary"}
										</Text>
										<Text 
											style={{
												color: "#FCFCFC",
												fontSize: 12,
												width: 172,
											}}>
											{"Skincare  .  Beauty  .  Selfcare"}
										</Text>
									</LinearGradient>
								</ImageBackground>
								<Image
									source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9e64033f-a82d-45ee-8e40-eaa2cb28fdf4"}} 
									resizeMode = {"stretch"}
									style={{
										position: "absolute",
										bottom: -22,
										left: 35,
										width: 86,
										height: 86,
									}}
								/>
							</View>
							<Text 
								style={{
									position: "absolute",
									top: -14,
									left: 70,
									color: "#FFFFFF",
									fontSize: 40,
									fontWeight: "bold",
									textAlign: "center",
									width: 134,
								}}>
								{"Matchr"}
							</Text>
						</View>
						<View 
							style={{
								alignSelf: "flex-start",
								flexDirection: "row",
								alignItems: "center",
								paddingVertical: 1,
								marginLeft: 137,
							}}>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/f1ff7976-1db2-41ea-8cb2-a63e2f6a60f6"}} 
								resizeMode = {"stretch"}
								style={{
									width: 11,
									height: 13,
									marginRight: 7,
								}}
							/>
							<Text 
								style={{
									color: "#FCFCFC",
									fontSize: 10,
									fontWeight: "bold",
									textAlign: "right",
									width: 55,
								}}>
								{"Delhi, India "}
							</Text>
						</View>
					</View>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5593a43b-90c7-4510-a766-984f6212d4b6"}} 
						resizeMode = {"stretch"}
						style={{
							position: "absolute",
							top: 0,
							left: 19,
							width: 36,
							height: 29,
						}}
					/>
				</View>
				<Text 
					style={{
						color: "#FFFFFF",
						fontSize: 12,
						marginBottom: 15,
						marginLeft: 43,
						width: 298,
					}}>
					{"At The Ordinary, we also believe that finding the right skincare should be as rewarding as the results themselves. Our goal is to provide quality solutions grounded in science, transparency, and trust."}
				</Text>
				<Text 
					style={{
						color: "#FFFFFF",
						fontSize: 14,
						fontWeight: "bold",
						marginBottom: 10,
						marginLeft: 43,
					}}>
					{"Looking for"}
				</Text>
				<View 
					style={{
						alignSelf: "flex-start",
						flexDirection: "row",
						alignItems: "center",
						marginBottom: 8,
						marginLeft: 56,
					}}>
					<TouchableOpacity 
						style={{
							borderColor: "#FFFFFF",
							borderRadius: 10,
							borderWidth: 1,
							paddingVertical: 8,
							paddingHorizontal: 20,
							marginRight: 8,
						}} onPress={()=>alert('Pressed!')}>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 10,
							}}>
							{"Lifestyle"}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity 
						style={{
							borderColor: "#FFFFFF",
							borderRadius: 10,
							borderWidth: 1,
							paddingVertical: 8,
							paddingHorizontal: 20,
							marginRight: 8,
						}} onPress={()=>alert('Pressed!')}>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 10,
							}}>
							{"UGC"}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity 
						style={{
							borderColor: "#FFFFFF",
							borderRadius: 10,
							borderWidth: 1,
							paddingVertical: 8,
							paddingHorizontal: 20,
							marginRight: 8,
						}} onPress={()=>alert('Pressed!')}>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 10,
							}}>
							{"Review"}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity 
						style={{
							borderColor: "#FFFFFF",
							borderRadius: 10,
							borderWidth: 1,
							paddingVertical: 8,
							paddingHorizontal: 20,
						}} onPress={()=>alert('Pressed!')}>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 10,
							}}>
							{"Beauty"}
						</Text>
					</TouchableOpacity>
				</View>
				<TouchableOpacity 
					style={{
						alignSelf: "flex-start",
						borderColor: "#FFFFFF",
						borderRadius: 10,
						borderWidth: 1,
						paddingVertical: 8,
						paddingHorizontal: 20,
						marginBottom: 27,
						marginLeft: 56,
					}} onPress={()=>alert('Pressed!')}>
					<Text 
						style={{
							color: "#FFFFFF",
							fontSize: 10,
						}}>
						{"Skincare"}
					</Text>
				</TouchableOpacity>
				<View 
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginBottom: 19,
						marginHorizontal: 30,
					}}>
					<View 
						style={{
							flex: 1,
							flexDirection: "row",
							backgroundColor: "#000000",
							borderColor: "#D9D9D9",
							borderRadius: 10,
							borderWidth: 1,
							paddingVertical: 23,
							paddingHorizontal: 19,
							marginRight: 12,
						}}>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/eead5559-cb83-4bac-81ee-52bade3baf4b"}} 
							resizeMode = {"stretch"}
							style={{
								width: 22,
								height: 18,
								marginRight: 11,
							}}
						/>
						<View 
							style={{
								flex: 1,
								paddingRight: 2,
							}}>
							<Text 
								style={{
									color: "#ACACAC",
									fontSize: 10,
									marginBottom: 9,
									marginLeft: 2,
								}}>
								{"Campaign budget"}
							</Text>
							<Text 
								style={{
									color: "#FFFFFF",
									fontSize: 20,
									fontWeight: "bold",
									textAlign: "center",
									marginBottom: 9,
									marginLeft: 2,
								}}>
								{"20k-50k"}
							</Text>
							<Text 
								style={{
									color: "#ACACAC",
									fontSize: 7,
								}}>
								{"per collaboration"}
							</Text>
						</View>
					</View>
					<View 
						style={{
							flex: 1,
							backgroundColor: "#000000",
							borderColor: "#D9D9D9",
							borderRadius: 10,
							borderWidth: 1,
							paddingVertical: 21,
							paddingHorizontal: 17,
						}}>
						<View 
							style={{
								alignSelf: "flex-start",
								flexDirection: "row",
								alignItems: "center",
								marginBottom: 1,
								marginRight: 21,
							}}>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/38b1d7df-76d7-40dd-89f9-fad1c12d102e"}} 
								resizeMode = {"stretch"}
								style={{
									width: 20,
									height: 19,
									marginRight: 8,
								}}
							/>
							<Text 
								style={{
									color: "#ACACAC",
									fontSize: 10,
								}}>
								{"Campaign Period"}
							</Text>
						</View>
						<View 
							style={{
								alignItems: "flex-end",
								marginBottom: 4,
							}}>
							<Text 
								style={{
									color: "#FFFFFF",
									fontSize: 20,
									fontWeight: "bold",
									textAlign: "center",
									marginRight: 2,
									width: 97,
								}}>
								{"15jul-30jul"}
							</Text>
						</View>
						<Text 
							style={{
								color: "#ACACAC",
								fontSize: 7,
								marginLeft: 28,
							}}>
							{"15 days"}
						</Text>
					</View>
				</View>
				<View 
					style={{
						backgroundColor: "#000000",
						borderColor: "#D9D9D9",
						borderRadius: 18,
						borderWidth: 1,
						paddingVertical: 19,
						paddingRight: 25,
						marginBottom: 33,
						marginHorizontal: 30,
					}}>
					<Text 
						style={{
							color: "#FFFFFF",
							fontSize: 14,
							fontWeight: "bold",
							marginBottom: 18,
							marginLeft: 24,
						}}>
						{"Campaign Type"}
					</Text>
					<View 
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginLeft: 25,
						}}>
						<View 
							style={{
								flex: 1,
								alignItems: "center",
								marginRight: 28,
							}}>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5233ea75-385e-42b6-be33-feaa48fc3535"}} 
								resizeMode = {"stretch"}
								style={{
									width: 19,
									height: 20,
									marginBottom: 12,
								}}
							/>
							<Text 
								style={{
									color: "#FFFFFF",
									fontSize: 7,
									textAlign: "center",
								}}>
								{"Paid\nCollaboration"}
							</Text>
						</View>
						<View 
							style={{
								alignItems: "center",
								marginRight: 28,
							}}>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/c999b585-9ab6-496a-b568-34549aab02cf"}} 
								resizeMode = {"stretch"}
								style={{
									width: 18,
									height: 20,
									marginBottom: 12,
								}}
							/>
							<Text 
								style={{
									color: "#33363F",
									fontSize: 7,
									textAlign: "center",
									width: 24,
								}}>
								{"Product\nReview"}
							</Text>
						</View>
						<View 
							style={{
								flex: 1,
								alignItems: "center",
								marginRight: 28,
							}}>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/38da39d1-d511-4fab-8da1-db43c91aeda9"}} 
								resizeMode = {"stretch"}
								style={{
									width: 18,
									height: 19,
									marginBottom: 12,
								}}
							/>
							<Text 
								style={{
									color: "#33363F",
									fontSize: 7,
									textAlign: "center",
								}}>
								{"UGC\nCampaign"}
							</Text>
						</View>
						<View 
							style={{
								flex: 1,
								alignItems: "center",
								marginRight: 28,
							}}>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/781dd25f-b1cb-4125-bc2a-34982442c882"}} 
								resizeMode = {"stretch"}
								style={{
									width: 16,
									height: 20,
									marginBottom: 12,
								}}
							/>
							<Text 
								style={{
									color: "#33363F",
									fontSize: 7,
									textAlign: "center",
								}}>
								{"Brand\nAmbassador"}
							</Text>
						</View>
						<View 
							style={{
								alignItems: "center",
							}}>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/3848ed3e-e839-4a36-996f-ec938516ebc8"}} 
								resizeMode = {"stretch"}
								style={{
									width: 21,
									height: 21,
									marginBottom: 12,
								}}
							/>
							<Text 
								style={{
									color: "#33363F",
									fontSize: 7,
									textAlign: "center",
									width: 30,
								}}>
								{"Event\nCoverage"}
							</Text>
						</View>
					</View>
				</View>
				<Text 
					style={{
						color: "#FFFFFF",
						fontSize: 14,
						fontWeight: "bold",
						marginBottom: 13,
						marginLeft: 24,
					}}>
					{"Brand vibe"}
				</Text>
				<View 
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginBottom: 17,
						marginHorizontal: 23,
					}}>
					<View 
						style={{
							flex: 1,
							alignItems: "center",
							backgroundColor: "#000000",
							borderColor: "#FFFFFF80",
							borderRadius: 18,
							borderWidth: 1,
							paddingTop: 14,
							paddingBottom: 19,
							paddingHorizontal: 7,
							marginRight: 9,
						}}>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/ab6d5730-9289-44ae-be88-c39cf172ec55"}} 
							resizeMode = {"stretch"}
							style={{
								width: 16,
								height: 15,
								marginBottom: 10,
							}}
						/>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 8,
								fontWeight: "bold",
							}}>
							{"Premium "}
						</Text>
					</View>
					<View 
						style={{
							flex: 1,
							alignItems: "center",
							backgroundColor: "#000000",
							borderColor: "#FFFFFF80",
							borderRadius: 18,
							borderWidth: 1,
							paddingTop: 13,
							paddingBottom: 18,
							paddingHorizontal: 7,
							marginRight: 9,
						}}>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/aaf4c1e9-4e8e-4cab-8136-8b071de036ce"}} 
							resizeMode = {"stretch"}
							style={{
								width: 16,
								height: 16,
								marginBottom: 10,
							}}
						/>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 8,
								fontWeight: "bold",
							}}>
							{"Minimal"}
						</Text>
					</View>
					<View 
						style={{
							flex: 1,
							alignItems: "center",
							backgroundColor: "#000000",
							borderColor: "#FFFFFF80",
							borderRadius: 18,
							borderWidth: 1,
							paddingTop: 14,
							paddingBottom: 19,
							paddingHorizontal: 7,
							marginRight: 9,
						}}>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/87f94c4d-a6d4-4c68-a26b-1a06d69b9c17"}} 
							resizeMode = {"stretch"}
							style={{
								width: 12,
								height: 15,
								marginBottom: 10,
							}}
						/>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 8,
								fontWeight: "bold",
							}}>
							{"Bold"}
						</Text>
					</View>
					<View 
						style={{
							flex: 1,
							alignItems: "center",
							backgroundColor: "#000000",
							borderColor: "#FFFFFF80",
							borderRadius: 18,
							borderWidth: 1,
							paddingTop: 13,
							paddingBottom: 18,
							paddingHorizontal: 7,
							marginRight: 9,
						}}>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/f5f965dd-a003-4e3f-b523-414d005ee329"}} 
							resizeMode = {"stretch"}
							style={{
								width: 14,
								height: 16,
								marginBottom: 10,
							}}
						/>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 8,
								fontWeight: "bold",
							}}>
							{"Authentic "}
						</Text>
					</View>
					<View 
						style={{
							flex: 1,
							alignItems: "center",
							backgroundColor: "#000000",
							borderColor: "#FFFFFF80",
							borderRadius: 18,
							borderWidth: 1,
							paddingTop: 14,
							paddingBottom: 19,
							paddingHorizontal: 7,
						}}>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/19fff241-9f38-42fc-8f3a-8318120f7651"}} 
							resizeMode = {"stretch"}
							style={{
								width: 15,
								height: 15,
								marginBottom: 10,
							}}
						/>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 8,
								fontWeight: "bold",
							}}>
							{"Genz"}
						</Text>
					</View>
				</View>
				<View 
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 15,
						marginHorizontal: 24,
					}}>
					<Text 
						style={{
							color: "#FFFFFF",
							fontSize: 14,
							fontWeight: "bold",
							width: 191,
						}}>
						{"Previously collaborated with"}
					</Text>
					<Text 
						style={{
							color: "#F05A28",
							fontSize: 10,
							fontWeight: "bold",
						}}>
						{"View all"}
					</Text>
				</View>
				<View 
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginBottom: 31,
						marginHorizontal: 36,
					}}>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/deb757c3-5b39-49d2-ae70-1d018b94684a"}} 
						resizeMode = {"stretch"}
						style={{
							height: 57,
							flex: 1,
							marginRight: 11,
						}}
					/>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/fd5db57a-faba-4cf8-ba21-5ae9c710cb97"}} 
						resizeMode = {"stretch"}
						style={{
							height: 57,
							flex: 1,
							marginRight: 11,
						}}
					/>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/f00e5e61-88d5-4ce6-9ba8-a5a66deec13e"}} 
						resizeMode = {"stretch"}
						style={{
							height: 57,
							flex: 1,
							marginRight: 11,
						}}
					/>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/0d3a08cd-aa96-43fa-8d77-487e23a8fdae"}} 
						resizeMode = {"stretch"}
						style={{
							height: 57,
							flex: 1,
							marginRight: 11,
						}}
					/>
					<ImageBackground 
						source={{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7d9dd760-0d89-4070-bc15-eedcde4cb028"}} 
						resizeMode = {'stretch'}
						style={{
							flex: 1,
							paddingVertical: 23,
							paddingHorizontal: 15,
						}}
						>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 14,
								fontWeight: "bold",
							}}>
							{"+24"}
						</Text>
					</ImageBackground>
				</View>
				<Text 
					style={{
						color: "#FFFFFF",
						fontSize: 14,
						fontWeight: "bold",
						marginBottom: 15,
						marginLeft: 38,
						width: 111,
					}}>
					{"Brand campaign"}
				</Text>
				<View 
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginBottom: 15,
						marginLeft: 36,
						marginRight: 5,
					}}>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/42b95ca8-da33-496e-9f1f-97e691f176ef"}} 
						resizeMode = {"stretch"}
						style={{
							height: 440,
							flex: 1,
							marginRight: 8,
						}}
					/>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/1ed0d7e2-940d-451f-94ea-5cec8b77f375"}} 
						resizeMode = {"stretch"}
						style={{
							width: 25,
							height: 25,
						}}
					/>
				</View>
				<View 
					style={{
						alignItems: "center",
						marginBottom: 23,
					}}>
					<View 
						style={{
							flexDirection: "row",
							alignItems: "center",
						}}>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/f875cf15-65ff-4396-99c0-129c6f83dd94"}} 
							resizeMode = {"stretch"}
							style={{
								width: 10,
								height: 10,
								marginRight: 6,
							}}
						/>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/6dc8dfff-d4b0-4320-bb77-770d638ea888"}} 
							resizeMode = {"stretch"}
							style={{
								width: 10,
								height: 10,
								marginRight: 6,
							}}
						/>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/42d99714-6249-47e8-a8d3-32dabc543ce2"}} 
							resizeMode = {"stretch"}
							style={{
								width: 10,
								height: 10,
								marginRight: 6,
							}}
						/>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/8558ae66-1b89-46eb-9736-68536f16cad8"}} 
							resizeMode = {"stretch"}
							style={{
								width: 10,
								height: 10,
							}}
						/>
					</View>
				</View>
				<View 
					style={{
						alignItems: "center",
						backgroundColor: "#000000",
						borderColor: "#FFFFFF80",
						borderRadius: 18,
						borderWidth: 1,
						paddingTop: 24,
						paddingBottom: 20,
						paddingHorizontal: 40,
						marginBottom: 25,
						marginHorizontal: 37,
					}}>
					<Text 
						style={{
							color: "#FFFFFF",
							fontSize: 14,
							fontWeight: "bold",
							marginBottom: 20,
						}}>
						{"Deliverables"}
					</Text>
					<View 
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
						}}>
						<View 
							style={{
								alignItems: "center",
								paddingBottom: 5,
								paddingHorizontal: 1,
							}}>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/3bd13aa2-2db6-4ce1-b1f3-41b0cc4f35cd"}} 
								resizeMode = {"stretch"}
								style={{
									width: 28,
									height: 27,
									marginBottom: 22,
								}}
							/>
							<Text 
								style={{
									color: "#ACACAC",
									fontSize: 10,
								}}>
								{"1 Reels"}
							</Text>
						</View>
						<View 
							style={{
								alignItems: "center",
								paddingBottom: 6,
							}}>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/db06b739-fdb2-471e-8b69-5f7b473c669b"}} 
								resizeMode = {"stretch"}
								style={{
									width: 25,
									height: 25,
									marginBottom: 21,
								}}
							/>
							<Text 
								style={{
									color: "#ACACAC",
									fontSize: 10,
								}}>
								{"2 Stories"}
							</Text>
						</View>
						<View 
							style={{
								alignItems: "center",
								paddingBottom: 5,
								paddingHorizontal: 1,
							}}>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7e894aed-cea2-4dd4-b171-c8f232895014"}} 
								resizeMode = {"stretch"}
								style={{
									width: 26,
									height: 26,
									marginBottom: 22,
								}}
							/>
							<Text 
								style={{
									color: "#ACACAC",
									fontSize: 10,
								}}>
								{"1 Post"}
							</Text>
						</View>
					</View>
				</View>
				<View 
					style={{
						backgroundColor: "#000000",
						borderColor: "#FFFFFF80",
						borderRadius: 18,
						borderWidth: 1,
						paddingTop: 30,
						paddingBottom: 26,
						paddingLeft: 29,
						paddingRight: 18,
						marginBottom: 27,
						marginHorizontal: 37,
					}}>
					<Text 
						style={{
							color: "#FFFFFF",
							fontSize: 14,
							fontWeight: "bold",
							marginBottom: 17,
							marginLeft: 1,
						}}>
						{"Budget details"}
					</Text>
					<View 
						style={{
							flexDirection: "row",
							alignItems: "center",
							paddingVertical: 5,
						}}>
						<View 
							style={{
								flex: 1,
								marginRight: 48,
							}}>
							<Text 
								style={{
									color: "#ACACAC",
									fontSize: 10,
									marginBottom: 4,
								}}>
								{"Starting from"}
							</Text>
							<Text 
								style={{
									color: "#F05A28",
									fontSize: 24,
									fontWeight: "bold",
									marginLeft: 1,
								}}>
								{"20,000/-"}
							</Text>
						</View>
						<View 
							style={{
								flex: 1,
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								marginRight: 11,
							}}>
							<Text 
								style={{
									color: "#ACACAC",
									fontSize: 10,
									width: 69,
								}}>
								{"Payment Mode Bank Transfer Within 7 Days"}
							</Text>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/ef75ecb2-907c-45e3-84f5-26f8dcba445b"}} 
								resizeMode = {"stretch"}
								style={{
									width: 20,
									height: 23,
								}}
							/>
						</View>
					</View>
				</View>
				<View 
					style={{
						backgroundColor: "#000000",
						borderColor: "#FFFFFF80",
						borderRadius: 18,
						borderWidth: 1,
						paddingTop: 26,
						paddingBottom: 22,
						paddingHorizontal: 22,
						marginBottom: 10,
						marginHorizontal: 37,
					}}>
					<Text 
						style={{
							color: "#FFFFFF",
							fontSize: 14,
							fontWeight: "bold",
							marginBottom: 17,
							marginLeft: 1,
						}}>
						{"Response time"}
					</Text>
					<View 
						style={{
							flexDirection: "row",
							alignItems: "center",
							paddingVertical: 10,
						}}>
						<View 
							style={{
								flex: 1,
								marginRight: 48,
							}}>
							<Text 
								style={{
									color: "#ACACAC",
									fontSize: 10,
									marginBottom: 4,
								}}>
								{"Usually Replies"}
							</Text>
							<Text 
								style={{
									color: "#F05A28",
									fontSize: 16,
									fontWeight: "bold",
								}}>
								{"Within 3 hours"}
							</Text>
						</View>
						<View 
							style={{
								flex: 1,
								flexDirection: "row",
								alignItems: "center",
							}}>
							<View 
								style={{
									flex: 1,
									marginRight: 20,
								}}>
								<Text 
									style={{
										color: "#ACACAC",
										fontSize: 10,
										marginBottom: 4,
									}}>
									{"Response Rate"}
								</Text>
								<Text 
									style={{
										color: "#F05A28",
										fontSize: 16,
										fontWeight: "bold",
									}}>
									{"94%"}
								</Text>
							</View>
							<Image
								source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b16f8c12-5dd4-434d-80c1-22e3d553c98c"}} 
								resizeMode = {"stretch"}
								style={{
									width: 20,
									height: 25,
								}}
							/>
						</View>
					</View>
				</View>
				<View 
					style={{
						backgroundColor: "#000000",
						borderColor: "#FFFFFF80",
						borderRadius: 18,
						borderWidth: 1,
						paddingTop: 27,
						paddingBottom: 23,
						paddingHorizontal: 19,
						marginBottom: 27,
						marginHorizontal: 37,
					}}>
					<Text 
						style={{
							color: "#FFFFFF",
							fontSize: 14,
							fontWeight: "bold",
							marginBottom: 17,
							marginLeft: 1,
						}}>
						{"Brand Rating"}
					</Text>
					<View 
						style={{
							flexDirection: "row",
							alignItems: "center",
						}}>
						<View 
							style={{
								paddingBottom: 2,
								marginRight: 12,
							}}>
							<View 
								style={{
									alignSelf: "flex-start",
									flexDirection: "row",
									alignItems: "center",
									marginBottom: 18,
									marginRight: 33,
								}}>
								<Image
									source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/c84dac6f-82ee-40e3-a3a7-a29be580d335"}} 
									resizeMode = {"stretch"}
									style={{
										width: 23,
										height: 23,
										marginRight: 2,
									}}
								/>
								<Text 
									style={{
										color: "#FFFFFF",
										fontSize: 24,
										fontWeight: "bold",
									}}>
									{"4.5/5"}
								</Text>
							</View>
							<Text 
								style={{
									color: "#FFFFFF",
									fontSize: 10,
									width: 103,
								}}>
								{"50+ creators\nrecommend this brand"}
							</Text>
						</View>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/10c92611-1084-4f8e-b123-e4b3a81aebef"}} 
							resizeMode = {"stretch"}
							style={{
								height: 57,
								flex: 1,
							}}
						/>
					</View>
				</View>
				<View 
					style={{
						alignItems: "center",
						backgroundColor: "#000000",
						borderColor: "#FFFFFF80",
						borderRadius: 18,
						borderWidth: 1,
						paddingTop: 21,
						paddingBottom: 17,
						paddingHorizontal: 36,
						marginBottom: 33,
						marginHorizontal: 37,
					}}>
					<Text 
						style={{
							color: "#FFFFFF",
							fontSize: 16,
							fontWeight: "bold",
							marginBottom: 14,
						}}>
						{"Verification & Safety"}
					</Text>
					<View 
						style={{
							flexDirection: "row",
							alignItems: "center",
						}}>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 12,
								fontWeight: "bold",
								marginRight: 39,
								flex: 1,
							}}>
							{"Verification Business\nOfficial brand account"}
						</Text>
						<Image
							source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/ee2b1ce7-2b54-497d-921f-b8fd5ab75bb8"}} 
							resizeMode = {"stretch"}
							style={{
								width: 1,
								height: 25,
								marginRight: 34,
							}}
						/>
						<Text 
							style={{
								color: "#FFFFFF",
								fontSize: 12,
								fontWeight: "bold",
								flex: 1,
							}}>
							{"Privacy Protected\nSecurity"}
						</Text>
					</View>
				</View>
				<TouchableOpacity 
					style={{
						alignItems: "center",
						backgroundColor: "#F05A28",
						borderRadius: 18,
						paddingVertical: 19,
						marginBottom: 16,
						marginHorizontal: 37,
					}} onPress={()=>alert('Pressed!')}>
					<Text 
						style={{
							color: "#FFFFFF",
							fontSize: 16,
							fontWeight: "bold",
						}}>
						{"Interested"}
					</Text>
				</TouchableOpacity>
				<View 
					style={{
						flexDirection: "row",
						alignItems: "center",
						backgroundColor: "#FFFFFF",
						borderTopLeftRadius: 20,
						borderTopRightRadius: 20,
						paddingVertical: 15,
						paddingHorizontal: 26,
						marginBottom: 1,
						marginHorizontal: 1,
						shadowColor: "#FFFFFF40",
						shadowOpacity: 0.3,
						shadowOffset: {
						    width: 0,
						    height: 4
						},
						shadowRadius: 6,
						elevation: 6,
					}}>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/85bc196c-9489-4a1d-b123-a3a6951cb2f0"}} 
						resizeMode = {"stretch"}
						style={{
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							height: 44,
							flex: 1,
							marginRight: 26,
						}}
					/>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/dd65739e-052d-4f66-b673-885c2c8107cf"}} 
						resizeMode = {"stretch"}
						style={{
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							width: 40,
							height: 43,
							marginRight: 26,
						}}
					/>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/8c1eee0a-f878-47ab-8cf6-c4d61de6076c"}} 
						resizeMode = {"stretch"}
						style={{
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							height: 48,
							flex: 1,
							marginRight: 26,
						}}
					/>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/821e4500-93af-402e-984c-15e0265d03f5"}} 
						resizeMode = {"stretch"}
						style={{
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							height: 50,
							flex: 1,
							marginRight: 27,
						}}
					/>
					<Image
						source = {{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/826d5cd9-9741-4f32-8f52-3d05bbb6e3ff"}} 
						resizeMode = {"stretch"}
						style={{
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							height: 44,
							flex: 1,
						}}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}